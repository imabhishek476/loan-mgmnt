export const parseAddress = (address = "") => {
  let mailingAddress = "";
  let city = "";
  let state = "";
  let zipCode = "";

  if (!address) return { mailingAddress, city, state, zipCode };

  address = address.trim();

  // 🔥 STEP 1: Extract ZIP
  const zipMatch = address.match(/\b\d{5,6}\b/);
  if (zipMatch) {
    zipCode = zipMatch[0];
    address = address.replace(zipCode, "").trim();
  }

  // 🔥 CASE 1: "NY -24578 norway Street"
  const match = address.match(/^([A-Z]{2})\s*-\s*(.*)$/i);
  if (match) {
    state = match[1];
    mailingAddress = match[2];
    return { mailingAddress, city, state, zipCode };
  }

  // 🔥 CASE 2: comma separated
  if (address.includes(",")) {
    const parts = address.split(",").map(p => p.trim());

    mailingAddress = parts[0] || "";

    // 👇 HANDLE "Lindenhurst NY"
    if (parts[1]) {
      const cityStateMatch = parts[1].match(/^(.*)\s([A-Z]{2})$/i);

      if (cityStateMatch) {
        city = cityStateMatch[1];   // Lindenhurst
        state = cityStateMatch[2];  // NY
      } else {
        city = parts[1];
      }
    }

    // fallback if state not found
    if (!state && parts[2]) {
      state = parts[2];
    }

    return { mailingAddress, city, state, zipCode };
  }

  // 🔥 DEFAULT
  mailingAddress = address;

  return { mailingAddress, city, state, zipCode };
};