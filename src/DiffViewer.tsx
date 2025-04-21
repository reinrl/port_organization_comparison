import ReactDiffViewer from "react-diff-viewer-continued";

export default function DiffViewer({
  leftContents,
  rightContents,
}: Readonly<{
  leftContents: string;
  rightContents: string;
}>) {
  return (
    <div style={{ height: "85vh", overflow: "auto" }}>
      <ReactDiffViewer
        oldValue={leftContents}
        leftTitle="Source"
        newValue={rightContents}
        rightTitle="Destination"
        splitView={true}
      />
    </div>
  );
}
