import Form from "react-bootstrap/Form";

interface SearchControlProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export default function SearchControl({ value, onChange }: Readonly<SearchControlProps>) {
  return (
    <Form.Group className="mb-3" controlId="searchText">
      <Form.Label>Search by identifier or title</Form.Label>
      <Form.Control
        type="text"
        placeholder="Search by identifier or title..."
        value={value}
        onChange={onChange}
      />
    </Form.Group>
  );
}
