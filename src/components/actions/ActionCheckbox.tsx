interface ActionCheckboxProps {
  identifier: string;
  description: string;
  run_url: string;
}

export default function ActionCheckbox({
  identifier,
  description,
  run_url,
}: ActionCheckboxProps) {
  return (
    <div className="mb-3 d-flex align-items-start">
      <input
        type="checkbox"
        id={identifier}
        name={identifier}
        className="mt-1"
        defaultChecked={true}
      />
      <label className="ms-2" htmlFor={identifier}>
        {description}
        <br />
        (run_url: <span className="fst-italic">{run_url})</span>
      </label>
      <br />
    </div>
  );
}
