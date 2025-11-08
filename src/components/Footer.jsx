import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: 2rem;
  margin-top: auto;
  border-top: 1px solid var(--color-border);
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const FooterLink = styled.a`
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary);
  }
`;

const Copyright = styled.p`
  margin: 0;
  font-size: 0.875rem;
`;

function Footer() {
  return (
    <FooterContainer>
      <FooterContent>
        <Copyright>
          © {new Date().getFullYear()} Worlddriven - Democratic Development
        </Copyright>
        <FooterLinks>
          <FooterLink
            href="https://github.com/worlddriven"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </FooterLink>
          <FooterLink
            href="https://github.com/worlddriven/documentation"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </FooterLink>
          <FooterLink
            href="https://github.com/worlddriven/core"
            target="_blank"
            rel="noopener noreferrer"
          >
            Core
          </FooterLink>
        </FooterLinks>
      </FooterContent>
    </FooterContainer>
  );
}

export default Footer;
