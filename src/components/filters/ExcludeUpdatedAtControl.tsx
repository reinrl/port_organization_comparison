import Form from "react-bootstrap/Form";

interface ExcludeUpdatedAtControlProps {
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export default function ExcludeUpdatedAtControl({
  checked,
  onChange,
}: Readonly<ExcludeUpdatedAtControlProps>) {
  return (
    <Form.Group className="mb-3" controlId="excludeUpdatedAt">
      <Form.Check
        type="checkbox"
        label="Exclude Updated At/By from Comparison"
        checked={checked}
        onChange={onChange}
      />
      <Form.Text className="text-muted">
        When checked, updatedAt and updatedBy fields will be excluded from the
        comparison.
      </Form.Text>
    </Form.Group>
  );
}
