import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

interface TypeFilterControlProps {
  uniqueTypes: string[];
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  onClear: () => void;
  label: string;
  allLabel: string;
}

export default function TypeFilterControl({
  uniqueTypes,
  value,
  onChange,
  onClear,
  label,
  allLabel,
}: Readonly<TypeFilterControlProps>) {
  if (!uniqueTypes.length) return null;

  return (
    <form>
      <label htmlFor="typeFilter">{label}: </label>
      <Form.Select
        id="typeFilter"
        name="typeFilter"
        value={value}
        onChange={onChange}
      >
        <option value="">{allLabel}</option>
        {uniqueTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </Form.Select>
      {value && (
        <div style={{ marginTop: "10px" }}>
          <small>
            Currently filtering by type: <strong>{value}</strong>{" "}
            <Button variant="secondary" onClick={onClear}>
              Clear filter
            </Button>
          </small>
        </div>
      )}
    </form>
  );
}
