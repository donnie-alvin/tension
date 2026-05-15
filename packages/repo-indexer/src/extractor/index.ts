import { createRequire } from 'node:module'

import {
  Node,
  Project,
  ScriptKind,
  SyntaxKind,
  type SourceFile,
} from 'ts-morph'

import type { ExtractedImport, ExtractedSymbol, ParsedFile } from '../types'

export interface ExtractedFileMetadata {
  symbols: ExtractedSymbol[]
  imports: ExtractedImport[]
}

const require = createRequire(import.meta.url)
const tsProject = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    allowJs: true,
    jsx: 4,
    target: 99,
  },
})

export function extractFileMetadata(file: ParsedFile): ExtractedFileMetadata {
  if (file.language === 'typescript' || file.language === 'javascript') {
    return extractTypeScriptMetadata(file)
  }

  return extractTreeSitterMetadata(file)
}

function extractTypeScriptMetadata(file: ParsedFile): ExtractedFileMetadata {
  const sourceFile = upsertSourceFile(file)
  const imports = extractImports(sourceFile)
  const symbols = dedupeSymbols([
    ...sourceFile.getFunctions().map((node) =>
      symbolFromNamedNode(node, 'function'),
    ),
    ...sourceFile.getClasses().map((node) => symbolFromNamedNode(node, 'class')),
    ...sourceFile
      .getInterfaces()
      .map((node) => symbolFromNamedNode(node, 'interface')),
    ...sourceFile.getTypeAliases().map((node) => symbolFromNamedNode(node, 'type')),
    ...sourceFile.getEnums().map((node) => symbolFromNamedNode(node, 'enum')),
    ...sourceFile.getVariableStatements().flatMap((statement) =>
      statement.getDeclarations().map((declaration) => ({
        name: declaration.getName(),
        kind: 'variable',
        isExported: statement.isExported(),
        isDefaultExport: false,
        line: statement.getStartLineNumber(),
        endLine: statement.getEndLineNumber(),
      })),
    ),
    ...sourceFile.getExportAssignments().map((node) => ({
      name: node.getExpression().getText(),
      kind: 'export',
      isExported: true,
      isDefaultExport: !node.isExportEquals(),
      line: node.getStartLineNumber(),
      endLine: node.getEndLineNumber(),
    })),
  ])

  return { symbols, imports }
}

function extractImports(sourceFile: SourceFile): ExtractedImport[] {
  const imports: ExtractedImport[] = []

  for (const declaration of sourceFile.getImportDeclarations()) {
    const namedImports = declaration
      .getNamedImports()
      .map((item) => item.getNameNode().getText())
    const defaultImport = declaration.getDefaultImport()?.getText()
    const namespaceImport = declaration.getNamespaceImport()?.getText()
    const importedNames = [
      ...(defaultImport ? ['default'] : []),
      ...(namespaceImport ? ['*'] : []),
      ...namedImports,
    ]

    imports.push({
      importSpecifier: declaration.getModuleSpecifierValue(),
      isExternal: isExternalImport(declaration.getModuleSpecifierValue()),
      importedNames,
    })
  }

  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expression = call.getExpression().getText()
    const [firstArgument] = call.getArguments()

    if (
      expression === 'require' &&
      firstArgument &&
      Node.isStringLiteral(firstArgument)
    ) {
      imports.push({
        importSpecifier: firstArgument.getLiteralText(),
        isExternal: isExternalImport(firstArgument.getLiteralText()),
        importedNames: [],
      })
    }
  }

  for (const declaration of sourceFile.getExportDeclarations()) {
    const specifier = declaration.getModuleSpecifierValue()
    if (!specifier) {
      continue
    }

    imports.push({
      importSpecifier: specifier,
      isExternal: isExternalImport(specifier),
      importedNames: declaration.getNamedExports().map((item) => item.getName()),
    })
  }

  return dedupeImports(imports)
}

function symbolFromNamedNode(
  node: {
    getName(): string | undefined
    getStartLineNumber(): number
    getEndLineNumber(): number
    isExported(): boolean
    isDefaultExport(): boolean
  },
  kind: string,
): ExtractedSymbol {
  return {
    name: node.getName() ?? 'default',
    kind,
    isExported: node.isExported(),
    isDefaultExport: node.isDefaultExport(),
    line: node.getStartLineNumber(),
    endLine: node.getEndLineNumber(),
  }
}

function extractTreeSitterMetadata(file: ParsedFile): ExtractedFileMetadata {
  const tree = parseWithTreeSitter(file)
  const symbols: ExtractedSymbol[] = []
  const imports: ExtractedImport[] = []

  if (!tree) {
    return { symbols, imports }
  }

  walkTree(tree.rootNode, (node: TreeSitterNode) => {
    if (['function_definition', 'class_definition'].includes(node.type)) {
      const nameNode = node.childForFieldName?.('name')
      if (nameNode) {
        symbols.push({
          name: nameNode.text,
          kind: node.type === 'class_definition' ? 'class' : 'function',
          isExported: false,
          isDefaultExport: false,
          line: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
        })
      }
    }

    if (node.type === 'import_statement' || node.type === 'import_from_statement') {
      const text = node.text
      const match = text.match(/(?:from\s+)?['"](?<specifier>[^'"]+)['"]/u)
      if (match?.groups?.specifier) {
        imports.push({
          importSpecifier: match.groups.specifier,
          isExternal: isExternalImport(match.groups.specifier),
          importedNames: [],
        })
      }
    }
  })

  return { symbols: dedupeSymbols(symbols), imports: dedupeImports(imports) }
}

function parseWithTreeSitter(file: ParsedFile): TreeSitterTree | undefined {
  try {
    const Parser = require('tree-sitter')
    const parser = new Parser()

    if (file.language === 'typescript' || file.language === 'javascript') {
      const typescript = require('tree-sitter-typescript')
      parser.setLanguage(
        file.filePath.endsWith('.tsx') || file.filePath.endsWith('.jsx')
          ? typescript.tsx
          : typescript.typescript,
      )
      return parser.parse(file.content)
    }
  } catch {
    return undefined
  }

  return undefined
}

function walkTree(node: TreeSitterNode, visit: (node: TreeSitterNode) => void): void {
  visit(node)
  for (let index = 0; index < node.childCount; index += 1) {
    const child = node.child(index)
    if (child) {
      walkTree(child, visit)
    }
  }
}

function upsertSourceFile(file: ParsedFile): SourceFile {
  const scriptKind =
    file.filePath.endsWith('.tsx') || file.filePath.endsWith('.jsx')
      ? ScriptKind.TSX
      : file.language === 'javascript'
        ? ScriptKind.JS
        : ScriptKind.TS
  const existing = tsProject.getSourceFile(file.absolutePath)

  if (existing) {
    existing.replaceWithText(file.content)
    return existing
  }

  return tsProject.createSourceFile(file.absolutePath, file.content, {
    overwrite: true,
    scriptKind,
  })
}

function isExternalImport(specifier: string): boolean {
  return !specifier.startsWith('.') && !specifier.startsWith('/')
}

function dedupeSymbols(symbols: ExtractedSymbol[]): ExtractedSymbol[] {
  const seen = new Set<string>()
  return symbols.filter((symbol) => {
    const key = `${symbol.kind}:${symbol.name}:${symbol.line}:${symbol.endLine ?? ''}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function dedupeImports(imports: ExtractedImport[]): ExtractedImport[] {
  const bySpecifier = new Map<string, ExtractedImport>()

  for (const item of imports) {
    const existing = bySpecifier.get(item.importSpecifier)
    if (!existing) {
      bySpecifier.set(item.importSpecifier, item)
      continue
    }

    existing.importedNames = [...new Set([...existing.importedNames, ...item.importedNames])]
  }

  return [...bySpecifier.values()]
}

interface TreeSitterTree {
  rootNode: TreeSitterNode
}

interface TreeSitterNode {
  type: string
  text: string
  childCount: number
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  child(index: number): TreeSitterNode | null
  childForFieldName?(fieldName: string): TreeSitterNode | null
}
