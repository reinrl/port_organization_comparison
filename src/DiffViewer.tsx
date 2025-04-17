import ReactDiffViewer from "react-diff-viewer-continued";

export default function DiffViewer({
  leftContents,
  rightContents,
}: Readonly<{
  leftContents: string;
  rightContents: string;
}>) {
  return (
      <ReactDiffViewer
        oldValue={leftContents}
        leftTitle="Dev"
        newValue={rightContents}
        rightTitle="Prod"
        splitView={true}
      />
  );
}
