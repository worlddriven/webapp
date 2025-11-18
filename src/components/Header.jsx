import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: var(--color-primary);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;

  &:hover {
    color: var(--color-secondary);
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">Worlddriven Admin</Logo>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
