import { downloadTextFile } from './download-file';

describe('downloadTextFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a blob URL, sets it as the anchor download, clicks it, then revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadTextFile('results.md', '# Hello', 'text/markdown');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchor.href).toContain('blob:mock-url');
    expect(anchor.download).toBe('results.md');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('defaults the mime type to text/markdown when none is given', () => {
    let capturedType = '';
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => {
        capturedType = blob.type;
        return 'blob:mock-url';
      }),
      revokeObjectURL: vi.fn(),
    });
    const anchor = document.createElement('a');
    vi.spyOn(anchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadTextFile('f.md', 'content');
    expect(capturedType).toBe('text/markdown;charset=utf-8');
  });

  it('is a no-op when document is unavailable (SSR), never throws', () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error simulating an SSR environment with no DOM
    delete globalThis.document;
    expect(() => downloadTextFile('f.md', 'content')).not.toThrow();
    globalThis.document = originalDocument;
  });
});
