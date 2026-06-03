import Form from "react-bootstrap/Form";

interface PresenceFilterControlProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

export default function PresenceFilterControl({
  value,
  onChange,
}: Readonly<PresenceFilterControlProps>) {
  return (
    <Form.Group controlId="presenceFilter">
      <Form.Label>Filter by presence</Form.Label>
      <Form.Select id="presenceFilter" value={value} onChange={onChange}>
        <option value="">show all</option>
        <option value="not-in-source">not in source</option>
        <option value="not-in-destination">not in destination</option>
      </Form.Select>
    </Form.Group>
  );
}
