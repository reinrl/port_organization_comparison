import ReactDiffViewer from "react-diff-viewer-continued";

export default function DiffViewer({
  leftContents,
  rightContents,
  configItemName,
}: Readonly<{
  leftContents: string;
  rightContents: string;
  configItemName: string;
}>) {
  return (
    <>
      <h1><a href="">home</a> | {configItemName}</h1>
      <hr />
      <ReactDiffViewer
        oldValue={leftContents}
        newValue={rightContents}
        splitView={true}
      />
    </>
  );
}
