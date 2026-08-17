import React from 'react';
import { Link } from 'react-router-dom';
import mtjfLogo from '../../assets/mtjf_logo.png';
import './PrivacyPolicy.css';

const EFFECTIVE_DATE = 'June 3, 2026';
const CONTACT_EMAIL = 'info@mtjfoundation.org';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page">
      <header className="privacy-policy-header">
        <img src={mtjfLogo} alt="MTJ Foundation" className="privacy-policy-logo" />
        <div>
          <h1>Privacy Policy</h1>
          <p className="privacy-policy-meta">
            MTJ Foundation MTJF Solutions (DMS)
            <br />
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>
        <Link to="/" className="privacy-policy-back">
          Back to login
        </Link>
      </header>

      <main className="privacy-policy-content">
        <section>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy describes how Muhammad Tayyab Jawaid (MTJ) Foundation
            (&quot;MTJ Foundation&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, stores, and protects
            information when you use the MTJ Foundation MTJF Solutions (DMS)
            mobile and web application (the &quot;App&quot;).
          </p>
          <p>
            The App is intended for authorized MTJ Foundation staff and volunteers to
            manage donors, donations, donation boxes, appeals, reports, and related
            fundraising operations. By signing in or using the App, you agree to this
            policy.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Account and authentication data</h3>
          <ul>
            <li>Email address and password (for login)</li>
            <li>Name, role, department, branch, and permissions assigned to your account</li>
            <li>Session and authentication tokens used to keep you signed in securely</li>
          </ul>

          <h3>2.2 Donor and donation data</h3>
          <p>
            When you create or manage records in the DMS, the App processes information
            you enter about donors and donations, which may include:
          </p>
          <ul>
            <li>Donor name, phone number, email address, and postal address</li>
            <li>City, country, and geographic or route assignment</li>
            <li>Donation amounts, dates, payment method, frequency, and status</li>
            <li>Donation box assignments, collections, and related notes</li>
            <li>Appeals, campaigns, events, and fundraising reports</li>
            <li>Audit history and activity logs linked to records you create or edit</li>
          </ul>

          <h3>2.3 Forms, reports, and operational data</h3>
          <ul>
            <li>Data submitted through DMS forms (donor registration, box donations, reports, tasks, imports)</li>
            <li>Files or attachments you upload where the feature is enabled</li>
            <li>Social post and communication metadata managed within DMS modules</li>
          </ul>

          <h3>2.4 Technical and usage information</h3>
          <ul>
            <li>Device type, browser, app version, and general usage needed to run and secure the App</li>
            <li>IP address, timestamps, and server logs for authentication, error diagnosis, and security</li>
            <li>Offline-sync queue data stored on your device when offline features are used (pending actions until sync)</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Authenticate users and enforce role-based access</li>
            <li>Record, manage, and report on donors, donations, and fundraising activities</li>
            <li>Operate DMS workflows (donation boxes, appeals, recurring donations, geographic data, tasks)</li>
            <li>Send operational notifications related to your account or assigned work</li>
            <li>Maintain audit trails for accountability and compliance</li>
            <li>Improve reliability, security, and performance of the App</li>
            <li>Sync offline entries to our secure servers when connectivity is restored</li>
          </ul>
          <p>
            We do not sell donor or user personal information.
          </p>
        </section>

        <section>
          <h2>4. Legal Basis and Authorized Use</h2>
          <p>
            The App is for authorized MTJ Foundation personnel only. You must use donor
            and personal data solely for legitimate MTJ Foundation fundraising,
            donor relations, and program operations, in line with organizational
            policies and applicable law.
          </p>
        </section>

        <section>
          <h2>5. Data Sharing</h2>
          <p>We may share information only as needed to operate the DMS:</p>
          <ul>
            <li>
              <strong>Service providers:</strong> Hosting, database, email, or infrastructure
              providers that process data on our behalf under contractual safeguards
            </li>
            <li>
              <strong>Payment partners:</strong> Where online donations are processed outside
              DMS (e.g. payment gateways on public donation channels), those providers
              receive payment-related data under their own privacy terms
            </li>
            <li>
              <strong>Legal requirements:</strong> When required by law, regulation, or valid
              legal process
            </li>
          </ul>
          <p>We do not share DMS data with third parties for their independent marketing.</p>
        </section>

        <section>
          <h2>6. Data Storage and Security</h2>
          <ul>
            <li>Primary data is stored on secure servers using PostgreSQL and access-controlled APIs</li>
            <li>Passwords are not stored in plain text; industry-standard authentication practices apply</li>
            <li>Access is limited by user roles and permissions within the organization</li>
            <li>
              Local device storage (e.g. browser IndexedDB) may temporarily hold offline
              entries until they are synced; protect your device and do not share login credentials
            </li>
          </ul>
          <p>
            No method of transmission or storage is 100% secure. Report suspected
            unauthorized access to {CONTACT_EMAIL} immediately.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain donor, donation, and operational records for as long as needed for
            fundraising operations, legal obligations, auditing, and historical reporting.
            Account logs may be retained for security and troubleshooting for a limited period.
          </p>
        </section>

        <section>
          <h2>8. Your Rights and Choices</h2>
          <p>Depending on applicable law, individuals may have rights to:</p>
          <ul>
            <li>Request access to or correction of their personal information</li>
            <li>Request deletion where legally permitted (subject to record-keeping requirements)</li>
            <li>Object to or restrict certain processing</li>
          </ul>
          <p>
            Donors may contact MTJ Foundation directly. Authorized App users should
            route data requests through their supervisor or {CONTACT_EMAIL}.
          </p>
        </section>

        <section>
          <h2>9. Children&apos;s Privacy</h2>
          <p>
            The DMS is not directed at children under 13 (or the minimum age in your
            jurisdiction). We do not knowingly collect personal information from children
            through this staff application.
          </p>
        </section>

        <section>
          <h2>10. International Users</h2>
          <p>
            MTJ Foundation operates primarily in Pakistan. If you access the App from
            other regions, your information may be processed on servers located where our
            providers operate, with appropriate safeguards.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The effective date at the
            top will change when we do. Continued use of the App after updates constitutes
            acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>
            For privacy questions, data requests, or security concerns regarding the MTJ
            Foundation DMS:
          </p>
          <ul>
            <li>
              Email:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li>Organization: Muhammad Tayyab Jawaid (MTJ) Foundation</li>
            <li>Website: <a href="https://www.mtjfoundation.org" target="_blank" rel="noopener noreferrer">www.mtjfoundation.org</a></li>
          </ul>
        </section>
      </main>

      <footer className="privacy-policy-footer">
        <p>&copy; {new Date().getFullYear()} MTJ Foundation. All rights reserved.</p>
        <Link to="/">Return to login</Link>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
