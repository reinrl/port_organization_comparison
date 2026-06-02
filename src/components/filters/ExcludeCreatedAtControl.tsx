import Form from "react-bootstrap/Form";

interface ExcludeCreatedAtControlProps {
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export default function ExcludeCreatedAtControl({
  checked,
  onChange,
}: Readonly<ExcludeCreatedAtControlProps>) {
  return (
    <Form.Group className="mb-3" controlId="excludeCreatedAt">
      <Form.Check
        type="checkbox"
        label="Exclude Created At/By from Comparison"
        checked={checked}
        onChange={onChange}
      />
      <Form.Text className="text-muted">
        When checked, createdAt and createdBy fields will be excluded from the
        comparison.
      </Form.Text>
    </Form.Group>
  );
}
