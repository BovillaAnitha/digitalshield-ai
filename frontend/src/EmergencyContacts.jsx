
import { useState } from "react";

const HELPLINES = [
  {
    name: "Emergency / Police",
    number: "112",
    description: "Immediate danger or emergency assistance",
  },
  {
    name: "Women Helpline",
    number: "181",
    description: "Support for women in distress",
  },
  {
    name: "Cybercrime Helpline",
    number: "1930",
    description: "Primarily online financial fraud",
  },
];

const STORAGE_KEY = "digitalshield-trusted-contacts";

function readContacts() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState(readContacts);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  function saveContacts(updated) {
    setContacts(updated);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  }

  function addContact(event) {
    event.preventDefault();

    const cleanedPhone = phone.replace(/[\s()-]/g, "");

    if (!/^\+?\d{7,15}$/.test(cleanedPhone)) {
      alert("Enter a valid phone number.");
      return;
    }

    const newContact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: cleanedPhone,
      relationship: relationship.trim(),
    };

    saveContacts([...contacts, newContact]);

    setName("");
    setPhone("");
    setRelationship("");
  }

  function deleteContact(id) {
    if (!window.confirm("Delete this trusted contact?")) {
      return;
    }

    saveContacts(
      contacts.filter((contact) => contact.id !== id)
    );
  }

  function prepareMessage(contact) {
    const message =
      "Hi, I may need support with an online safety " +
      "situation. Could you please contact me when " +
      "you're available?";

    const url =
      `sms:${contact.phone}?body=${encodeURIComponent(message)}`;

    window.location.href = url;
  }

  return (
    <section className="panel emergency-panel">
      <h2>🆘 Emergency Assistance</h2>

      <p className="muted">
        Access official helplines and trusted contacts.
        DigitalShield AI does not automatically place
        calls or send alerts.
      </p>

      <h3>Official Emergency & Security Helplines</h3>

      <div className="helpline-grid">
        {HELPLINES.map((helpline) => (
          <div className="helpline-card" key={helpline.number}>
            <h4>{helpline.name}</h4>

            <strong className="helpline-number">
              {helpline.number}
            </strong>

            <p>{helpline.description}</p>

            <a
              className="emergency-link"
              href={`tel:${helpline.number}`}
            >
              📞 Call {helpline.number}
            </a>
          </div>
        ))}
      </div>

      <p>
        Experiencing online harassment or blackmail?
        {" "}
        <a
          href="https://cybercrime.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Report Cybercrime (official portal)
        </a>
      </p>

      <h3>My Trusted Contacts</h3>

      <p className="muted">
        Add someone you trust. Contact details are stored
        only in this browser's local storage, which is
        not secure on shared or compromised devices.
      </p>

      <form onSubmit={addContact} className="incident-form">
        <label>
          Contact name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Trusted friend"
            maxLength={80}
            required
          />
        </label>

        <label>
          Phone number
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="e.g. +919876543210"
            required
          />
        </label>

        <label>
          Relationship
          <input
            value={relationship}
            onChange={(event) =>
              setRelationship(event.target.value)
            }
            placeholder="e.g. Friend, parent, mentor"
            maxLength={60}
          />
        </label>

        <button type="submit">
          Add Trusted Contact
        </button>
      </form>

      <div className="trusted-contact-list">
        {contacts.length === 0 ? (
          <p className="muted">
            No trusted contacts saved yet.
          </p>
        ) : (
          contacts.map((contact) => (
            <div className="trusted-contact-card" key={contact.id}>
              <div>
                <h4>{contact.name}</h4>
                <p>{contact.relationship}</p>
                <p>{contact.phone}</p>
              </div>

              <div className="contact-actions">
                <a
                  className="emergency-link"
                  href={`tel:${contact.phone}`}
                >
                  Call
                </a>

                <button
                  type="button"
                  onClick={() => prepareMessage(contact)}
                >
                  Prepare SMS
                </button>

                <button
                  type="button"
                  onClick={() => deleteContact(contact.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="disclaimer">
        This is a prototype. Calling and SMS features
        depend on the device and installed applications.
        A prepared SMS is not sent automatically.
        For immediate danger in India, dial 112 directly.
      </p>
    </section>
  );
}
