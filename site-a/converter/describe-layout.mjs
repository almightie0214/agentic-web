// CVT-META-001: describe only the parser's selected input format, never source metadata.
export function describeLayout(layout) {
  if (layout !== 'theora' && layout !== 'markdown') {
    throw new Error('CVT-META-001: invalid converter input.');
  }
  return `Converted ${layout === 'theora' ? 'Theora' : 'Markdown'} role conversation network.`;
}
