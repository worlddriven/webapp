import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Hero = styled.section`
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(
    135deg,
    var(--color-primary-light) 0%,
    var(--color-primary) 100%
  );
  border-radius: 8px;
  color: white;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Section = styled.section`
  padding: 2rem;
  background-color: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border);
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin: 0 0 1rem 0;
  color: var(--color-text);
`;

const SectionContent = styled.div`
  color: var(--color-text-secondary);
  line-height: 1.6;

  p {
    margin: 0 0 1rem 0;
  }

  ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.5rem 0;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const Card = styled.div`
  padding: 1.5rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  margin: 0 0 0.75rem 0;
  color: var(--color-primary);
`;

const CardDescription = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.5;
`;

function Home() {
  return (
    <HomeContainer>
      <Hero>
        <Title>Worlddriven Admin</Title>
        <Subtitle>
          Democratic development through collective decision-making
        </Subtitle>
      </Hero>

      <Section>
        <SectionTitle>Welcome to Worlddriven</SectionTitle>
        <SectionContent>
          <p>
            Worlddriven is a democratic development platform where decisions are
            made collectively through pull requests and time-based voting.
          </p>
          <p>
            This admin interface allows you to manage repositories,
            configurations, and monitor the democratic development process
            across the organization.
          </p>
        </SectionContent>
      </Section>

      <CardGrid>
        <Card>
          <CardTitle>Repository Management</CardTitle>
          <CardDescription>
            View and manage repositories within the Worlddriven organization.
            Track pull requests, voting progress, and merge schedules.
          </CardDescription>
        </Card>

        <Card>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure organization settings, automation parameters, and
            democratic voting rules for repositories.
          </CardDescription>
        </Card>

        <Card>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>
            Monitor contribution statistics, voting patterns, and the health of
            democratic processes across projects.
          </CardDescription>
        </Card>
      </CardGrid>
    </HomeContainer>
  );
}

export default Home;
