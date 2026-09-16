import React from "react";

const About: React.FC = () => {
  return (
    <main className="about-page">

      {/* Page Header */}
      <section className="about-header">
        <h1>About StrengthOut.com</h1>

        <p>Empowering your Right journey</p>
      </section>


      {/* Our Mission */}
      <section className="about-section">

        <h2>Our Mission</h2>

        <p>
          At StrengthOut, our mission is to bridge the gap
          between skilled individuals and top companies by
          providing comprehensive technical training and
          career opportunities. We strive to empower
          individuals from all backgrounds to pursue
          rewarding careers in technology and beyond.
        </p>

      </section>


      {/* Resources */}
      <section className="about-section">

        <h2>Resources</h2>

        <p>
          We offer a wide range of resources to support
          your career journey:
        </p>

        <ul>
          <li>Technical skill development courses</li>
          <li>Job placement assistance</li>
          <li>
            Networking opportunities with industry
            professionals
          </li>
          <li>
            Career guidance and mentorship programs
          </li>
        </ul>

      </section>


      {/* Opportunities */}
      <section className="about-section">

        <h2>Our Opportunities</h2>

        <p>
          StrengthOut provides opportunities for:
        </p>

        <ul>
          <li>
            Students seeking internships and entry-level
            positions
          </li>

          <li>
            Professionals looking to advance their careers
          </li>

          <li>
            Individuals transitioning to new roles or
            industries
          </li>

          <li>
            Companies seeking skilled talent for their teams
          </li>
        </ul>

      </section>


      {/* Team */}
      <section className="about-section">

        <h2>Our Team</h2>

        <p>Director</p>

      </section>


      {/* Powered By */}
      <section className="about-section">

        <h2>Powered by</h2>

        <p>
          StrengthOut is proudly powered by iSignTech,
          a leader in innovative technology solutions.
        </p>

      </section>

    </main>
  );
};

export default About;