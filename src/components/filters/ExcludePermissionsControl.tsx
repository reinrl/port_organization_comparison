import Form from "react-bootstrap/Form";

interface ExcludePermissionsControlProps {
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export default function ExcludePermissionsControl({
  checked,
  onChange,
}: Readonly<ExcludePermissionsControlProps>) {
  return (
    <Form.Group className="mb-3" controlId="excludePermissions">
      <Form.Check
        type="checkbox"
        label="Exclude Permissions from Comparison"
        checked={checked}
        onChange={onChange}
      />
      <Form.Text className="text-muted">
        When checked, permissions will be excluded from the comparison.
      </Form.Text>
    </Form.Group>
  );
}
