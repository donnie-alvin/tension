import type { ExtractedImport, ExtractedSymbol, ParsedFile } from '../types'

const symbolPattern =
  /^(?<export>export\s+)?(?<default>default\s+)?(?<kind>async\s+function|function|class|interface|type|const|let|var|enum)\s+(?<name>[A-Za-z_$][\w$]*)/u
const namedImportPattern =
  /^\s*import\s+(?<names>.+?)\s+from\s+['"](?<specifier>[^'"]+)['"]/u
const sideEffectImportPattern = /^\s*import\s+['"](?<specifier>[^'"]+)['"]/u
const requirePattern = /require\(\s*['"](?<specifier>[^'"]+)['"]\s*\)/u

export interface ExtractedFileMetadata {
  symbols: ExtractedSymbol[]
  imports: ExtractedImport[]
}

export function extractFileMetadata(file: ParsedFile): ExtractedFileMetadata {
  const symbols: ExtractedSymbol[] = []
  const imports: ExtractedImport[] = []

  file.content.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1
    const symbolMatch = line.trim().match(symbolPattern)

    if (symbolMatch?.groups) {
      const rawKind = symbolMatch.groups.kind
      symbols.push({
        name: symbolMatch.groups.name,
        kind: rawKind.replace('async ', ''),
        isExported: Boolean(symbolMatch.groups.export),
        isDefaultExport: Boolean(symbolMatch.groups.default),
        line: lineNumber,
      })
    }

    const importMatch =
      line.match(namedImportPattern) ??
      line.match(sideEffectImportPattern) ??
      line.match(requirePattern)

    if (importMatch?.groups?.specifier) {
      imports.push({
        importSpecifier: importMatch.groups.specifier,
        isExternal: isExternalImport(importMatch.groups.specifier),
        importedNames: parseImportedNames(importMatch.groups.names ?? ''),
      })
    }
  })

  return { symbols, imports }
}

function isExternalImport(specifier: string): boolean {
  return !specifier.startsWith('.') && !specifier.startsWith('/')
}

function parseImportedNames(rawNames: string): string[] {
  return rawNames
    .replace(/[{}]/gu, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(/\s+as\s+/u)[0].trim())
}
