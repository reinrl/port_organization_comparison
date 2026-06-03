import Form from "react-bootstrap/Form";

interface TypeFilterControlProps {
  uniqueTypes: string[];
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  label: string;
  allLabel: string;
}

export default function TypeFilterControl({
  uniqueTypes,
  value,
  onChange,
  label,
  allLabel,
}: Readonly<TypeFilterControlProps>) {
  if (!uniqueTypes.length) return null;

  return (
    <Form.Group controlId="typeFilter">
      <Form.Label>{label}: </Form.Label>
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
    </Form.Group>
  );
}
