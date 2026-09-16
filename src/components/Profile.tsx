import React from "react";

import profileImage from "../assets/image.png";
import introVideo from "../assets/Uday video.mp4";

const Profile: React.FC = () => {
  const technicalSkills: string[] = [
    "React JS",
    "React Native",
    "Angular",
    "Core Java",
    "HTML-5",
    "CSS-3",
    "Bootstrap",
    "MySql",
  ];

  const strengths: string[] = [
    "Problem-Solving",
    "Team Collaboration",
    "Effective Communication",
    "Adaptability",
    "Time Management",
  ];

  return (
    <section className="profile-section">
      <div className="profile-container">

        {/* ==============================
            PROFILE
        ============================== */}

        <div className="profile-card">

          <h1>Profile</h1>

          <div className="profile-image-wrapper">
            <img
              src={profileImage}
              alt="Udhay Kumar"
              className="profile-image"
            />
          </div>

          <div className="profile-details">

            <p>
              <strong>Name:</strong> Udhay Kumar
            </p>

            <p>
              <strong>Date of Birth:</strong> Jan 6, 2001
            </p>

            <p>
              <strong>Highest Education:</strong>{" "}
              Bachelor's of Engineering
            </p>

            <p>
              <strong>City:</strong> Hyderabad
            </p>

          </div>

          <button
            type="button"
            className="connect-button"
          >
            Connect
          </button>

        </div>


        {/* ==============================
            RIGHT CONTENT
        ============================== */}

        <div className="profile-content">

          <div className="content-grid">

            {/* ==========================
                MYSELF / VIDEO
            ========================== */}

            <div className="info-card myself-card">

              <h2>Myself</h2>

              <video
                className="myself-video"
                controls
                playsInline
                preload="metadata"
              >
                <source
                  src={introVideo}
                  type="video/mp4"
                />

                Your browser does not support the video tag.
              </video>

            </div>


            {/* ==========================
                TECHNICAL SKILLS
            ========================== */}

            <div className="info-card">

              <h2>
                Technical-
                <br />
                Skills
              </h2>

              <ul>
                {technicalSkills.map(
                  (skill: string, index: number) => (
                    <li key={index}>
                      {skill}
                    </li>
                  )
                )}
              </ul>

            </div>


            {/* ==========================
                PROJECTS
            ========================== */}

            <div className="info-card">

              <h2>
                Projects &
                <br />
                Social Media
              </h2>

              <ul className="project-links">

                <li>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Project 1
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Project 2
                  </a>
                </li>

                <li>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn Profile
                  </a>
                </li>

              </ul>

            </div>


            {/* ==========================
                STRENGTHS
            ========================== */}

            <div className="info-card">

              <h2>Strengths</h2>

              <ul>
                {strengths.map(
                  (strength: string, index: number) => (
                    <li key={index}>
                      {strength}
                    </li>
                  )
                )}
              </ul>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default Profile;