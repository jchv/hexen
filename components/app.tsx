import * as React from "react";

const BYTES_PER_LINE = 0x10;
const EMPTY_LINE = new Uint8Array(0);

const fileClasses = ["f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9"];

function guid() {
  var S4 = () => (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

class File {
  readonly guid = guid();

  constructor(readonly filename: string, readonly data: ArrayBuffer) {}
}

interface FileListProps {
  files: readonly File[];

  onAddFiles: (f: File[]) => void;
  onRemoveFile: (f: File) => void;
}

const FileList = ({files, onAddFiles, onRemoveFile}: FileListProps) => {
  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const domFiles = Array.from(event.target.files);
    const files: File[] = [];
    event.target.value = null;

    for (const domFile of domFiles) {
      files.push(new File(domFile.name, await domFile.arrayBuffer()));
    }

    onAddFiles(files);
  };

  return <>
    <input type="file" multiple onChange={handleChange} />
    <ul>
      {files.map(file => 
        <li key={file.guid}>
          <code>{file.filename}</code>
          <button onClick={() => onRemoveFile(file)}>Remove</button>
        </li>
      )}
    </ul>
  </>;
}

interface HexLineProps {
  line: Uint8Array;
  diffLine?: Uint8Array;
  linePos: number;
  cursorPos: number;
  className?: string;
}

const HexLine = ({line, diffLine, linePos, cursorPos, className}: HexLineProps) => {
  const bytes: Array<number|null> = Array.from(line);
  const diffBytes: Array<number|null>|undefined = diffLine && Array.from(diffLine);

  for (; bytes.length < BYTES_PER_LINE; ) {
    bytes.push(null);
  }

  if (diffBytes) {
    for (; diffBytes.length < BYTES_PER_LINE; ) {
      diffBytes.push(null);
    }
  }

  return <div className={`hexline ${className}`}>
    <span className="lineno">{linePos.toString(16).padStart(4, "0")}</span>
    <span className="hexdata">
      {bytes.map((n, index) => {
        let haveDiff = diffLine ? diffLine[index] !== n : false;
        return <span className={haveDiff ? 'diff' : undefined}>
          {n?.toString(16).padStart(2, "0") || "\xA0\xA0"}
        </span>;
      })}
      </span>
    <span className="asciidata">{bytes.map(n => {
        if (n === null) {
          return '';
        }
        if (n >= 0x20 && n <= 0x7F) {
          return String.fromCharCode(n);
        }
        return <span className="np">.</span>;
      })}</span>
  </div>;
}

interface InterleavedHexViewProps {
  files: readonly File[];

  cursorPos: number;
  onMoveCursor: (c: number) => void;
}

const InterleavedHexView = ({files, cursorPos, onMoveCursor}: InterleavedHexViewProps) => {
  const hexLineCount = (Math.max(...files.map(file => file.data.byteLength)) + 15) / 16 | 0;
  const hexLines: React.ReactElement[] = [];

  for (let i = 0; i < hexLineCount; i++) {
    for (let j = 0; j < files.length; j++) {
      const startIndex = i * BYTES_PER_LINE;

      const file = files[j];
      const size = Math.min(file.data.byteLength - startIndex, BYTES_PER_LINE);
      const line = size > 0 ? new Uint8Array(file.data, startIndex, size) : EMPTY_LINE;

      const diffFile = files[0];
      const diffSize = Math.min(diffFile.data.byteLength - startIndex, BYTES_PER_LINE);
      const diffLine = diffSize > 0 ? new Uint8Array(diffFile.data, startIndex, diffSize) : EMPTY_LINE;

      hexLines.push(
        <HexLine
          key={`${file.guid}:${startIndex}:${size}`}
          line={line}
          diffLine={j > 0 ? diffLine : undefined}
          linePos={startIndex}
          cursorPos={cursorPos}
          className={fileClasses[j]} />
      );
    }
  }

  return <div className="hexview" tabIndex={0}>
    {hexLines}
  </div>;
}

export const App = () => {
  const [files, setFiles] = React.useState<File[]>([]);

  const addFiles = (f: File[]) =>
    setFiles(files.concat(f));

  const removeFile = (f: File) =>
    setFiles(files.filter(n => f !== n));

  const [cursorPos, setCursorPos] = React.useState(0);

  return <>
    <h1>hexen</h1>
    <p>a small multi-hex file viewer.</p>
    <FileList
      files={files}
      onAddFiles={addFiles}
      onRemoveFile={removeFile} />
    <InterleavedHexView
      files={files}
      cursorPos={cursorPos}
      onMoveCursor={setCursorPos} />
  </>;
};
