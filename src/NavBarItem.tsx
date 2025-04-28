import Nav from "react-bootstrap/Nav";

interface NavBarItemProps {
  eventKey: string;
  href: string;
  label: string;
}

export default function NavBarItem({ eventKey, href, label }: Readonly<NavBarItemProps>) {
  return (
    <Nav.Item>
      <Nav.Link eventKey={eventKey} href={href}>
        {label}
      </Nav.Link>
    </Nav.Item>
  );
}
