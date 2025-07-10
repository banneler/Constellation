document.addEventListener("DOMContentLoaded", () => {
  // --- SUPABASE SETUP ---
  const SUPABASE_URL = "https://pjxcciepfypzrfmlfchj.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqeGNjaWVwZnlwenJmbWxmY2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMTU4NDQsImV4cCI6MjA2NzY5MTg0NH0.m_jyE0e4QFevI-mGJHYlGmA12lXf8XoMDoiljUav79c";
  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  // --- STATE MANAGEMENT ---
  let state = {
    currentUser: null,
    contacts: [],
    accounts: [],
    sequences: [],
    sequence_steps: [],
    activities: [],
    contact_sequences: [],
    deals: [],
    selectedContactId: null,
    selectedAccountId: null,
    selectedSequenceId: null,
    dealsSortBy: "name",
    dealsSortDir: "asc"
  };

  // --- DOM ELEMENT SELECTORS ---
  const loaderOverlay = document.getElementById("loader-overlay");
  const authContainer = document.getElementById("auth-container");
  const crmContainer = document.querySelector(".crm-container");
  const authForm = document.getElementById("auth-form");
  const authTitle = document.getElementById("auth-title");
  const authError = document.getElementById("auth-error");
  const authEmailInput = document.getElementById("auth-email");
  const authPasswordInput = document.getElementById("auth-password");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authToggleLink = document.getElementById("auth-toggle-link");
  const logoutBtn = document.getElementById("logout-btn");
  const debugBtn = document.getElementById("debug-btn");
  const navButtons = document.querySelectorAll(".nav-button");
  const contentViews = document.querySelectorAll(".content-view");
  const contactList = document.getElementById("contact-list");
  const contactForm = document.getElementById("contact-form");
  const contactSearch = document.getElementById("contact-search");
  const bulkImportContactsBtn = document.getElementById(
    "bulk-import-contacts-btn"
  );
  const contactCsvInput = document.getElementById("contact-csv-input");
  const addContactBtn = document.getElementById("add-contact-btn");
  const deleteContactBtn = document.getElementById("delete-contact-btn");
  const logActivityBtn = document.getElementById("log-activity-btn");
  const assignSequenceBtn = document.getElementById("assign-sequence-btn");
  const contactActivitiesList = document.getElementById(
    "contact-activities-list"
  );
  const accountList = document.getElementById("account-list");
  const addAccountBtn = document.getElementById("add-account-btn");
  const bulkImportAccountsBtn = document.getElementById(
    "bulk-import-accounts-btn"
  );
  const accountCsvInput = document.getElementById("account-csv-input");
  const accountForm = document.getElementById("account-form");
  const deleteAccountBtn = document.getElementById("delete-account-btn");
  const accountContactsList = document.getElementById("account-contacts-list");
  const accountActivitiesList = document.getElementById(
    "account-activities-list"
  );
  const accountDealsTableBody = document.querySelector(
    "#account-deals-table tbody"
  );
  const addDealBtn = document.getElementById("add-deal-btn");
  const sequenceList = document.getElementById("sequence-list");
  const addSequenceBtn = document.getElementById("add-sequence-btn");
  const importSequenceBtn = document.getElementById("import-sequence-btn");
  const sequenceCsvInput = document.getElementById("sequence-csv-input");
  const deleteSequenceBtn = document.getElementById("delete-sequence-btn");
  const sequenceStepsTable = document.querySelector(
    "#sequence-steps-table tbody"
  );
  const addStepBtn = document.getElementById("add-step-btn");
  const renameSequenceBtn = document.getElementById("rename-sequence-btn");
  const dashboardTable = document.querySelector("#dashboard-table tbody");
  const recentActivitiesTable = document.querySelector(
    "#recent-activities-table tbody"
  );
  const allTasksTable = document.querySelector("#all-tasks-table tbody");
  const dealsTable = document.getElementById("deals-table");
  const dealsTableBody = document.querySelector("#deals-table tbody");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const contactSequenceInfoText = document.getElementById(
    "contact-sequence-info-text"
  );
  const removeFromSequenceBtn = document.getElementById(
    "remove-from-sequence-btn"
  );
  const noSequenceText = document.getElementById("no-sequence-text");
  const sequenceStatusContent = document.getElementById(
    "sequence-status-content"
  );
  const ringChart = document.getElementById("ring-chart");
  const ringChartText = document.getElementById("ring-chart-text");
  const metricCurrentCommit = document.getElementById("metric-current-commit");
  const metricBestCase = document.getElementById("metric-best-case");
  const metricFunnel = document.getElementById("metric-funnel");
  const MONTHLY_QUOTA = 5000;
  // --- NEW THEME ELEMENTS ---
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeNameSpan = document.getElementById("theme-name");

  // --- UTILITIES ---
  const formatDate = (ds) => (ds ? new Date(ds).toLocaleString() : "");
  const formatMonthYear = (ds) => {
    if (!ds) return "";
    const date = new Date(ds);
    const adjustedDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );
    return adjustedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long"
    });
  };
  const formatCurrencyK = (value) => {
    if (value === null || isNaN(value)) return "$0.0K";
    const valInK = value / 1000;
    return `$${valInK.toFixed(1)}K`;
  };
  const addDays = (d, days) => {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
  };
  const parseCsvRow = (row) => {
    const r = [];
    let c = "";
    let i = false;
    for (let h = 0; h < row.length; h++) {
      const a = row[h];
      if (a === '"') {
        i = !i;
      } else if (a === "," && !i) {
        r.push(c.trim());
        c = "";
      } else {
        c += a;
      }
    }
    r.push(c.trim());
    return r;
  };

  // --- CORRECTED DATA FETCHING ---
  async function loadAllData() {
    if (!state.currentUser) return;
    loaderOverlay.classList.remove("hidden");

    const userSpecificTables = [
      "contacts", "accounts", "sequences", 
      "activities", "contact_sequences", "deals"
    ];
    const publicTables = ["sequence_steps"];

    const userPromises = userSpecificTables.map((table) =>
      supabase
        .from(table)
        .select("*")
        .eq("user_id", state.currentUser.id)
    );
    const publicPromises = publicTables.map((table) =>
      supabase.from(table).select("*")
    );

    const allPromises = [...userPromises, ...publicPromises];
    const allTableNames = [...userSpecificTables, ...publicTables];

    try {
      const results = await Promise.allSettled(allPromises);
      results.forEach((result, index) => {
        const tableName = allTableNames[index];
        if (result.status === "fulfilled") {
          if (result.value.error) {
            console.error(
              `Supabase error fetching ${tableName}:`,
              result.value.error.message
            );
            state[tableName] = [];
          } else {
            state[tableName] = result.value.data || [];
          }
        } else {
          console.error(`Failed to fetch ${tableName}:`, result.reason);
          state[tableName] = [];
        }
      });
    } catch (error) {
      console.error("Critical error in loadAllData:", error);
    } finally {
      loaderOverlay.classList.add("hidden");
      render();
    }
  }

  // --- RENDER FUNCTIONS (REWRITTEN FOR STABILITY) ---
  const render = () => {
    const activeView = document.querySelector('.content-view.active-view');
    if (!activeView) return;

    // The logic is now to only render the components for the currently visible view.
    switch (activeView.id) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'contacts':
            renderContactList();
            renderContactDetails();
            break;
        case 'accounts':
            renderAccountList();
            renderAccountDetails();
            break;
        case 'sequences':
            renderSequenceList();
            renderSequenceSteps();
            break;
        case 'deals':
            renderDealsPage();
            renderDealsMetrics();
            break;
    }
  };

  const renderContactList = () => {
    if (!contactList) return; // Guard clause
    const searchTerm = contactSearch.value.toLowerCase();
    const filteredContacts = state.contacts
      .filter(
        (c) =>
        (c.first_name || "").toLowerCase().includes(searchTerm) ||
        (c.last_name || "").toLowerCase().includes(searchTerm) ||
        (c.email || "").toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => (a.last_name || "").localeCompare(b.last_name || ""));

    contactList.innerHTML = "";
    filteredContacts.forEach((contact) => {
      const item = document.createElement("div");
      item.className = "list-item";
      const inActiveSequence = state.contact_sequences.some(
        (cs) => cs.contact_id === contact.id && cs.status === "Active"
      );
      item.innerHTML = `${contact.first_name} ${contact.last_name} ${
         inActiveSequence
           ? '<span class="sequence-status-icon" style="color: var(--completed-color);">🔄</span>'
           : ""
       }`;
      item.dataset.id = contact.id;
      if (contact.id === state.selectedContactId)
        item.classList.add("selected");
      contactList.appendChild(item);
    });
  };

  const renderContactDetails = () => {
    if (!contactForm) return; // Guard clause
    const contact = state.contacts.find(
      (c) => c.id === state.selectedContactId
    );
    const accountDropdown = document.getElementById("contact-account-name");
    const lastSavedEl = document.getElementById("contact-last-saved");

    if (!accountDropdown || !lastSavedEl) return; // Guard clause for child elements

    accountDropdown.innerHTML = '<option value="">-- No Account --</option>';
    state.accounts
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .forEach((acc) => {
        const o = document.createElement("option");
        o.value = acc.id;
        o.textContent = acc.name;
        accountDropdown.appendChild(o);
      });

    if (contact) {
      contactForm.querySelector("#contact-id").value = contact.id;
      contactForm.querySelector("#contact-first-name").value =
        contact.first_name || "";
      contactForm.querySelector("#contact-last-name").value =
        contact.last_name || "";
      contactForm.querySelector("#contact-email").value = contact.email || "";
      contactForm.querySelector("#contact-phone").value = contact.phone || "";
      contactForm.querySelector("#contact-title").value = contact.title || "";
      contactForm.querySelector("#contact-notes").value = contact.notes || "";
      lastSavedEl.textContent = contact.last_saved ?
        `Last Saved: ${formatDate(contact.last_saved)}` :
        "";
      accountDropdown.value = contact.account_id || "";

      contactActivitiesList.innerHTML = "";
      state.activities
        .filter((act) => act.contact_id === contact.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((act) => {
          const li = document.createElement("li");
          li.textContent = `[${formatDate(act.date)}] ${act.type}: ${
           act.description
         }`;
          let borderColor = "var(--primary-blue)";
          const activityTypeLower = act.type.toLowerCase();
          if (activityTypeLower.includes("email")) {
            borderColor = "var(--warning-yellow)";
          } else if (activityTypeLower.includes("call")) {
            borderColor = "var(--completed-color)";
          }
          li.style.borderLeftColor = borderColor;
          contactActivitiesList.appendChild(li);
        });

      const activeSequence = state.contact_sequences.find(
        (cs) => cs.contact_id === contact.id && cs.status === "Active"
      );
      if (activeSequence) {
        const sequence = state.sequences.find(
          (s) => s.id === activeSequence.sequence_id
        );
        const steps = state.sequence_steps.filter(
          (s) => s.sequence_id === activeSequence.sequence_id
        );
        if (sequence && steps.length > 0) {
          const totalSteps = steps.length;
          const currentStep = activeSequence.current_step_number;
          const lastCompleted = currentStep - 1;
          const percentage =
            totalSteps > 0 ? Math.round((lastCompleted / totalSteps) * 100) : 0;
          ringChart.style.background = `conic-gradient(var(--completed-color) ${percentage}%, #3c3c3c ${percentage}%)`;
          ringChartText.textContent = `${lastCompleted}/${totalSteps}`;
          contactSequenceInfoText.textContent = `Enrolled in "${sequence.name}" (On Step ${currentStep} of ${totalSteps}).`;
          sequenceStatusContent.classList.remove("hidden");
          noSequenceText.classList.add("hidden");
        }
      } else {
        sequenceStatusContent.classList.add("hidden");
        noSequenceText.classList.remove("hidden");
      }
    } else {
      contactForm.reset();
      contactForm.querySelector("#contact-id").value = "";
      lastSavedEl.textContent = "";
      contactActivitiesList.innerHTML = "";
      sequenceStatusContent.classList.add("hidden");
      noSequenceText.textContent = "Select a contact to see details.";
      noSequenceText.classList.remove("hidden");
    }
  };

  const renderAccountList = () => {
    if (!accountList) return; // Guard clause
    accountList.innerHTML = "";
    state.accounts
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .forEach((account) => {
        const i = document.createElement("div");
        i.className = "list-item";
        i.textContent = account.name;
        i.dataset.id = account.id;
        if (account.id === state.selectedAccountId) i.classList.add("selected");
        accountList.appendChild(i);
      });
  };

  const renderAccountDetails = () => {
    if (!accountForm) return; // Guard clause
    const account = state.accounts.find(
      (a) => a.id === state.selectedAccountId
    );

    if (!accountContactsList || !accountActivitiesList || !accountDealsTableBody) return;

    accountContactsList.innerHTML = "";
    accountActivitiesList.innerHTML = "";
    accountDealsTableBody.innerHTML = "";

    if (account) {
      accountForm.querySelector("#account-id").value = account.id;
      accountForm.querySelector("#account-name").value = account.name || "";
      accountForm.querySelector("#account-website").value =
        account.website || "";
      accountForm.querySelector("#account-industry").value =
        account.industry || "";
      accountForm.querySelector("#account-phone").value = account.phone || "";
      accountForm.querySelector("#account-address").value =
        account.address || "";
      accountForm.querySelector("#account-notes").value = account.notes || "";
      document.getElementById(
        "account-last-saved"
      ).textContent = account.last_saved ?
        `Last Saved: ${formatDate(account.last_saved)}` :
        "";

      state.deals
        .filter((d) => d.account_id === account.id)
        .forEach((deal) => {
          const row = accountDealsTableBody.insertRow();
          row.innerHTML = `<td><input type="checkbox" class="commit-deal-checkbox" data-deal-id="${
           deal.id
         }" ${deal.is_committed ? "checked" : ""}></td><td>${
           deal.name
         }</td><td>${deal.term || ""}</td><td>${deal.stage}</td><td>$${
           deal.mrc || 0
         }</td><td>${
           deal.close_month ? formatMonthYear(deal.close_month) : ""
         }</td><td>${
           deal.products || ""
         }</td><td><button class="btn-secondary edit-deal-btn" data-deal-id="${
           deal.id
         }">Edit</button></td>`;
        });

      state.contacts
        .filter((c) => c.account_id === account.id)
        .forEach((c) => {
          const li = document.createElement("li");
          const inSeq = state.contact_sequences.some(
            (cs) => cs.contact_id === c.id && cs.status === "Active"
          );
          li.innerHTML = `<span class="contact-name-link" data-contact-id="${
           c.id
         }">${c.first_name} ${c.last_name}</span> (${c.title || "No Title"}) ${
           inSeq
             ? '<span class="sequence-status-icon" style="color: var(--completed-color);">🔄</span>'
             : ""
         }`;
          accountContactsList.appendChild(li);
        });

      state.activities
        .filter((act) => act.account_id === account.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((act) => {
          const c = state.contacts.find((c) => c.id === act.contact_id);
          const li = document.createElement("li");
          li.textContent = `[${formatDate(act.date)}] ${act.type} with ${
           c ? `${c.first_name} ${c.last_name}` : "Unknown"
         }: ${act.description}`;
          let borderColor = "var(--primary-blue)";
          const activityTypeLower = act.type.toLowerCase();
          if (activityTypeLower.includes("email")) {
            borderColor = "var(--warning-yellow)";
          } else if (activityTypeLower.includes("call")) {
            borderColor = "var(--completed-color)";
          }
          li.style.borderLeftColor = borderColor;
          accountActivitiesList.appendChild(li);
        });
    } else {
      accountForm.reset();
      accountForm.querySelector("#account-id").value = "";
      document.getElementById("account-last-saved").textContent = "";
    }
  };

  const renderSequenceList = () => {
    if (!sequenceList) return; // Guard clause
    sequenceList.innerHTML = "";
    state.sequences
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .forEach((seq) => {
        const i = document.createElement("div");
        i.className = "list-item";
        i.textContent = seq.name;
        i.dataset.id = seq.id;
        if (seq.id === state.selectedSequenceId) i.classList.add("selected");
        sequenceList.appendChild(i);
      });
  };

  const renderSequenceSteps = () => {
    if (!sequenceStepsTable) return; // Guard clause
    sequenceStepsTable.innerHTML = "";
    if (state.selectedSequenceId) {
      const steps = state.sequence_steps.filter(
        (s) => s.sequence_id === state.selectedSequenceId
      );
      steps
        .sort((a, b) => a.step_number - b.step_number)
        .forEach((step) => {
          const row = sequenceStepsTable.insertRow();
          row.innerHTML = `<td>${step.step_number}</td><td>${
           step.type
         }</td><td>${step.subject || ""}</td><td>${
           step.message || ""
         }</td><td>${step.delay_days}</td>`;
        });
    }
  };

  const renderDashboard = () => {
    if (!dashboardTable || !recentActivitiesTable || !allTasksTable) return; // Guard clause
    dashboardTable.innerHTML = "";
    recentActivitiesTable.innerHTML = "";
    allTasksTable.innerHTML = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    state.contact_sequences
      .filter(
        (cs) =>
        new Date(cs.next_step_due_date) <= today && cs.status === "Active"
      )
      .sort(
        (a, b) =>
        new Date(a.next_step_due_date) - new Date(b.next_step_due_date)
      )
      .forEach((cs) => {
        const contact = state.contacts.find((c) => c.id === cs.contact_id);
        const sequence = state.sequences.find((s) => s.id === cs.sequence_id);
        if (!contact || !sequence) return;
        const step = state.sequence_steps.find(
          (s) =>
          s.sequence_id === sequence.id &&
          s.step_number === cs.current_step_number
        );
        if (!step) return;
        const row = dashboardTable.insertRow();
        const desc = step.subject || step.message || "";
        let btnHtml = "";
        const type = step.type.toLowerCase();
        if (type === "email" && contact.email) {
          btnHtml = `<button class="btn-primary send-email-btn" data-cs-id="${
           cs.id
         }" data-contact-id="${contact.id}" data-subject="${encodeURIComponent(
           step.subject
         )}" data-message="${encodeURIComponent(
           step.message
         )}">Send Email</button>`;
        } else if (type === "linkedin") {
          btnHtml = `<button class="btn-primary linkedin-step-btn" data-id="${cs.id}">Go to LinkedIn</button>`;
        } else {
          btnHtml = `<button class="btn-primary complete-step-btn" data-id="${cs.id}">Complete</button>`;
        }
        row.innerHTML = `<td>${formatDate(cs.next_step_due_date)}</td><td>${
         contact.first_name
       } ${contact.last_name}</td><td>${sequence.name}</td><td>${
         step.step_number
       }: ${step.type}</td><td>${desc}</td><td>${btnHtml}</td>`;
      });

    state.contact_sequences
      .filter((cs) => cs.status === "Active")
      .sort(
        (a, b) =>
        new Date(a.next_step_due_date) - new Date(b.next_step_due_date)
      )
      .forEach((cs) => {
        const contact = state.contacts.find((c) => c.id === cs.contact_id);
        if (!contact) return;
        const account = contact.account_id ?
          state.accounts.find((a) => a.id === contact.account_id) :
          null;
        const row = allTasksTable.insertRow();
        row.innerHTML = `<td>${formatDate(cs.next_step_due_date)}</td><td>${
         contact.first_name
       } ${contact.last_name}</td><td>${
         account ? account.name : "N/A"
       }</td><td><button class="btn-secondary revisit-step-btn" data-cs-id="${
         cs.id
       }">Revisit Last Step</button></td>`;
      });

    state.activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20)
      .forEach((act) => {
        const contact = state.contacts.find((c) => c.id === act.contact_id);
        const account = contact ?
          state.accounts.find((a) => a.id === contact.account_id) :
          null;
        const row = recentActivitiesTable.insertRow();
        row.innerHTML = `<td>${formatDate(act.date)}</td><td>${
         account ? account.name : "N/A"
       }</td><td>${
         contact ? `${contact.first_name} ${contact.last_name}` : "N/A"
       }</td><td>${act.type}: ${act.description}</td>`;
      });
  };

  const renderDealsPage = () => {
    if (!dealsTableBody) return; // Guard clause
    const dealsWithAccount = state.deals.map((deal) => {
      const account = state.accounts.find((a) => a.id === deal.account_id);
      return { ...deal,
        account_name: account ? account.name : "N/A"
      };
    });
    dealsWithAccount.sort((a, b) => {
      const valA = a[state.dealsSortBy];
      const valB = b[state.dealsSortBy];
      let comparison = 0;
      if (typeof valA === "string") {
        comparison = (valA || "").localeCompare(valB || "");
      } else {
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;
      }
      return state.dealsSortDir === "desc" ? comparison * -1 : comparison;
    });
    dealsTableBody.innerHTML = "";
    dealsWithAccount.forEach((deal) => {
      const row = dealsTableBody.insertRow();
      row.innerHTML = `<td><input type="checkbox" class="commit-deal-checkbox" data-deal-id="${
       deal.id
     }" ${
       deal.is_committed ? "checked" : ""
     }></td><td class="deal-name-link" data-deal-id="${deal.id}">${
       deal.name
     }</td><td>${deal.term || ""}</td><td>${deal.account_name}</td><td>${
       deal.stage
     }</td><td>$${deal.mrc || 0}</td><td>${
       deal.close_month ? formatMonthYear(deal.close_month) : ""
     }</td><td>${
       deal.products || ""
     }</td><td><button class="btn-secondary edit-deal-btn" data-deal-id="${
       deal.id
     }">Edit</button></td>`;
    });
    document.querySelectorAll("#deals-table th.sortable").forEach((th) => {
      th.classList.remove("asc", "desc");
      if (th.dataset.sort === state.dealsSortBy) {
        th.classList.add(state.dealsSortDir);
      }
    });
  };

  const renderDealsMetrics = () => {
    if (!metricCurrentCommit) return; // Guard clause
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let currentCommit = 0;
    let bestCase = 0;
    let totalFunnel = 0;
    state.deals.forEach((deal) => {
      const dealCloseDate = deal.close_month ?
        new Date(deal.close_month) :
        null;
      const isCurrentMonth =
        dealCloseDate &&
        dealCloseDate.getMonth() === currentMonth &&
        dealCloseDate.getFullYear() === currentYear;
      totalFunnel += deal.mrc || 0;
      if (isCurrentMonth) {
        bestCase += deal.mrc || 0;
        if (deal.is_committed) {
          currentCommit += deal.mrc || 0;
        }
      }
    });
    const commitPercentage =
      MONTHLY_QUOTA > 0 ?
      ((currentCommit / MONTHLY_QUOTA) * 100).toFixed(1) :
      0;
    const bestCasePercentage =
      MONTHLY_QUOTA > 0 ? ((bestCase / MONTHLY_QUOTA) * 100).toFixed(1) : 0;
    metricCurrentCommit.textContent = formatCurrencyK(currentCommit);
    metricBestCase.textContent = formatCurrencyK(bestCase);
    metricFunnel.textContent = formatCurrencyK(totalFunnel);
    document.getElementById(
      "commit-quota-percent"
    ).textContent = `${commitPercentage}%`;
    document.getElementById(
      "best-case-quota-percent"
    ).textContent = `${bestCasePercentage}%`;
  };

  // --- MODAL & CORE FUNCTIONS ---
  let onConfirmCallback = null;
  const showModal = (title, bodyHtml, onConfirm) => {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    onConfirmCallback = onConfirm;
    modalBackdrop.classList.remove("hidden");
  };
  const hideModal = () => {
    modalBackdrop.classList.add("hidden");
    onConfirmCallback = null;
  };
  async function completeStep(csId) {
    const cs = state.contact_sequences.find((c) => c.id === csId);
    if (!cs) return;
    const sequence = state.sequences.find((s) => s.id === cs.sequence_id);
    const contact = state.contacts.find((c) => c.id === cs.contact_id);
    const step = state.sequence_steps.find(
      (s) =>
      s.sequence_id === cs.sequence_id &&
      s.step_number === cs.current_step_number
    );
    if (contact && sequence && step) {
      await supabase.from("activities").insert([{
        contact_id: contact.id,
        account_id: contact.account_id,
        date: new Date().toISOString(),
        type: `Sequence: ${step.type}`,
        description: step.subject || step.message || "Completed step"
      }]);
    }
    const nextStep = state.sequence_steps.find(
      (s) =>
      s.sequence_id === cs.sequence_id &&
      s.step_number === cs.current_step_number + 1
    );
    if (nextStep) {
      await supabase
        .from("contact_sequences")
        .update({
          current_step_number: nextStep.step_number,
          last_completed_date: new Date().toISOString(),
          next_step_due_date: addDays(
            new Date(),
            nextStep.delay_days
          ).toISOString()
        })
        .eq("id", cs.id);
    } else {
      await supabase
        .from("contact_sequences")
        .update({
          status: "Completed"
        })
        .eq("id", cs.id);
    }
    await loadAllData();
  }

  // --- THEME TOGGLE LOGIC ---
  const themes = ['dark', 'light', 'green'];
  let currentThemeIndex = 0;

  function applyTheme(themeName) {
    if (!themeNameSpan) return; // Guard clause
    document.body.className = `theme-${themeName}`;
    const capitalizedThemeName = themeName.charAt(0).toUpperCase() + themeName.slice(1);
    themeNameSpan.textContent = capitalizedThemeName;
    localStorage.setItem('crm-theme', themeName);
  }

  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const newTheme = themes[currentThemeIndex];
    applyTheme(newTheme);
  }

  // --- EVENT LISTENER SETUP ---
  function setupAuthEventListeners() {
    let isLoginMode = true;
    authToggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      isLoginMode = !isLoginMode;
      authTitle.textContent = isLoginMode ? "Login" : "Sign Up";
      authSubmitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
      authToggleLink.textContent = isLoginMode ?
        "Need an account? Sign Up" :
        "Have an account? Login";
      authError.textContent = "";
    });
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = authEmailInput.value;
      const password = authPasswordInput.value;
      authError.textContent = "";
      const {
        error
      } = isLoginMode ?
        await supabase.auth.signInWithPassword({
          email,
          password
        }) :
        await supabase.auth.signUp({
          email,
          password
        });
      if (error) {
        authError.textContent = error.message;
      } else if (!isLoginMode) {
        authError.textContent = "Check your email for a confirmation link!";
      } else {
        authForm.reset();
      }
    });
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
    });
  }

  function setupCrmEventListeners() {
    // Add the theme toggle listener
    themeToggleBtn.addEventListener("click", cycleTheme);
      
    modalConfirmBtn.addEventListener(
      "click",
      () => onConfirmCallback && onConfirmCallback()
    );
    modalCancelBtn.addEventListener("click", hideModal);
    debugBtn.addEventListener("click", () => {
      console.log(JSON.stringify(state, null, 2));
      alert("Current app state logged to console (F12).");
    });

    navButtons.forEach((button) => {
      // Exclude the new theme button from the view-switching logic
      if (button.id === "debug-btn" || button.id === "logout-btn" || button.id === 'theme-toggle-btn') return;
      button.addEventListener("click", (e) => {
        const targetId = e.currentTarget.dataset.target;
        navButtons.forEach((b) => {
            if (b.id !== 'theme-toggle-btn') {
                b.classList.remove("active")
            }
        });
        e.currentTarget.classList.add("active");
        contentViews.forEach((v) =>
          v.classList.toggle("active-view", v.id === targetId)
        );
        render();
      });
    });

    contactSearch.addEventListener("input", renderContactList);
    addContactBtn.addEventListener("click", () => {
      state.selectedContactId = null;
      renderContactList();
      renderContactDetails();
      contactForm.querySelector("#contact-first-name").focus();
    });
    contactList.addEventListener("click", (e) => {
      const item = e.target.closest(".list-item");
      if (item) {
        state.selectedContactId = Number(item.dataset.id);
        renderContactList();
        renderContactDetails();
      }
    });
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = Number(contactForm.querySelector("#contact-id").value);
      const data = {
        first_name: contactForm
          .querySelector("#contact-first-name")
          .value.trim(),
        last_name: contactForm.querySelector("#contact-last-name").value.trim(),
        email: contactForm.querySelector("#contact-email").value.trim(),
        phone: contactForm.querySelector("#contact-phone").value.trim(),
        title: contactForm.querySelector("#contact-title").value.trim(),
        account_id: Number(contactForm.querySelector("#contact-account-name").value) ||
          null,
        notes: contactForm.querySelector("#contact-notes").value,
        last_saved: new Date().toISOString(),
        user_id: state.currentUser.id
      };
      if (id) {
        await supabase.from("contacts").update(data).eq("id", id);
      } else {
        if (!data.first_name || !data.last_name)
          return alert("First and Last name are required.");
        await supabase.from("contacts").insert([data]);
      }
      await loadAllData();
    });
    deleteContactBtn.addEventListener("click", async () => {
      if (!state.selectedContactId) return;
      showModal(
        "Confirm Deletion",
        "Are you sure you want to delete this contact?",
        async () => {
          await supabase
            .from("contacts")
            .delete()
            .eq("id", state.selectedContactId);
          state.selectedContactId = null;
          await loadAllData();
          hideModal();
        }
      );
    });
    addAccountBtn.addEventListener("click", async () => {
      showModal(
        "New Account Name",
        `<label>Account Name</label><input type="text" id="modal-account-name" required>`,
        async () => {
          const name = document
            .getElementById("modal-account-name")
            .value.trim();
          if (name) {
            await supabase
              .from("accounts")
              .insert([{
                name: name,
                user_id: state.currentUser.id
              }]);
            await loadAllData();
            hideModal();
          } else {
            alert("Account name is required.");
          }
        }
      );
    });
    accountList.addEventListener("click", (e) => {
      const item = e.target.closest(".list-item");
      if (item) {
        state.selectedAccountId = Number(item.dataset.id);
        renderAccountList();
        renderAccountDetails();
      }
    });
    accountForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = Number(accountForm.querySelector("#account-id").value);
      if (!id) return;
      const data = {
        name: accountForm.querySelector("#account-name").value.trim(),
        website: accountForm.querySelector("#account-website").value.trim(),
        industry: accountForm.querySelector("#account-industry").value.trim(),
        phone: accountForm.querySelector("#account-phone").value.trim(),
        address: accountForm.querySelector("#account-address").value.trim(),
        notes: accountForm.querySelector("#account-notes").value,
        last_saved: new Date().toISOString()
      };
      await supabase.from("accounts").update(data).eq("id", id);
      await loadAllData();
      alert("Account saved!");
    });
    deleteAccountBtn.addEventListener("click", async () => {
      if (!state.selectedAccountId) return;
      showModal(
        "Confirm Deletion",
        "Are you sure you want to delete this account? This cannot be undone.",
        async () => {
          await supabase
            .from("accounts")
            .delete()
            .eq("id", state.selectedAccountId);
          state.selectedAccountId = null;
          await loadAllData();
          hideModal();
        }
      );
    });
    bulkImportAccountsBtn.addEventListener("click", () =>
      accountCsvInput.click()
    );
    accountCsvInput.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = async function(e) {
        const rows = e.target.result.split("\n").filter((r) => r.trim() !== "");
        const newRecords = rows.map((row) => {
          const c = parseCsvRow(row);
          return {
            name: c[0] || "",
            website: c[1] || "",
            industry: c[2] || "",
            address: c[3] || "",
            phone: c[4] || "",
            user_id: state.currentUser.id
          };
        });
        if (newRecords.length > 0) {
          await supabase.from("accounts").insert(newRecords);
          alert(`${newRecords.length} accounts imported.`);
          await loadAllData();
        }
      };
      r.readAsText(f);
      e.target.value = "";
    });
    bulkImportContactsBtn.addEventListener("click", () =>
      contactCsvInput.click()
    );
    contactCsvInput.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = async function(e) {
        const rows = e.target.result.split("\n").filter((r) => r.trim() !== "");
        const newRecords = rows
          .map((row) => {
            const c = parseCsvRow(row);
            return {
              first_name: c[0] || "",
              last_name: c[1] || "",
              email: c[2] || "",
              phone: c[3] || "",
              title: c[4] || "",
              user_id: state.currentUser.id
            };
          })
          .filter((c) => c.first_name && c.last_name);
        if (newRecords.length > 0) {
          await supabase.from("contacts").insert(newRecords);
          alert(`${newRecords.length} contacts imported.`);
          await loadAllData();
        }
      };
      r.readAsText(f);
      e.target.value = "";
    });
    sequenceList.addEventListener("click", (e) => {
      const item = e.target.closest(".list-item");
      if (item) {
        state.selectedSequenceId = Number(item.dataset.id);
        renderSequenceList();
        renderSequenceSteps();
      }
    });
    addSequenceBtn.addEventListener("click", async () => {
      showModal(
        "New Sequence Name",
        `<label>Sequence Name</label><input type="text" id="modal-sequence-name" required>`,
        async () => {
          const name = document
            .getElementById("modal-sequence-name")
            .value.trim();
          if (name) {
            await supabase
              .from("sequences")
              .insert([{
                name: name,
                user_id: state.currentUser.id
              }]);
            await loadAllData();
            hideModal();
          } else {
            alert("Sequence name is required.");
          }
        }
      );
    });
    renameSequenceBtn.addEventListener("click", () => {
      if (!state.selectedSequenceId)
        return alert("Please select a sequence to rename.");
      const selectedSequence = state.sequences.find(
        (s) => s.id === state.selectedSequenceId
      );
      if (!selectedSequence) return alert("Selected sequence not found.");
      showModal(
        "Rename Sequence",
        `<label>New Sequence Name</label><input type="text" id="modal-new-sequence-name" value="${selectedSequence.name}" required>`,
        async () => {
          const newName = document
            .getElementById("modal-new-sequence-name")
            .value.trim();
          if (newName && newName !== selectedSequence.name) {
            await supabase
              .from("sequences")
              .update({
                name: newName
              })
              .eq("id", state.selectedSequenceId);
            await loadAllData();
            alert("Sequence renamed successfully!");
            hideModal();
          } else if (newName === selectedSequence.name) {
            hideModal();
          } else {
            alert("New sequence name cannot be empty.");
          }
        }
      );
    });
    deleteSequenceBtn.addEventListener("click", async () => {
      if (!state.selectedSequenceId) return alert("Please select a sequence.");
      showModal(
        "Confirm Deletion",
        "Are you sure? This will delete the sequence and all its steps. This cannot be undone.",
        async () => {
          await supabase
            .from("sequences")
            .delete()
            .eq("id", state.selectedSequenceId);
          state.selectedSequenceId = null;
          await loadAllData();
          hideModal();
        }
      );
    });
    importSequenceBtn.addEventListener("click", () => {
      if (!state.selectedSequenceId)
        return alert(
          "Please select a sequence template first before importing steps."
        );
      sequenceCsvInput.click();
    });
    sequenceCsvInput.addEventListener("change", (e) => {
      if (!state.selectedSequenceId) return;
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = async function(e) {
        const rows = e.target.result.split("\n").filter((r) => r.trim() !== "");
        const selectedSequence = state.sequences.find(
          (s) => s.id === state.selectedSequenceId
        );
        const newRecords = rows
          .slice(1)
          .map((row) => {
            const c = parseCsvRow(row);
            return {
              sequence_id: state.selectedSequenceId,
              step_number: parseInt(c[0], 10),
              type: c[1] || "",
              subject: c[2] || "",
              message: c[3] || "",
              delay_days: parseInt(c[4], 10) || 0
            };
          })
          .filter((record) => !isNaN(record.step_number));
        if (newRecords.length > 0) {
          const {
            error
          } = await supabase
            .from("sequence_steps")
            .insert(newRecords);
          if (error) {
            alert("Error importing sequence steps: " + error.message);
          } else {
            alert(
              `${newRecords.length} steps imported into "${selectedSequence.name}".`
            );
            await loadAllData();
          }
        } else {
          alert("No valid records found to import.");
        }
      };
      r.readAsText(f);
      e.target.value = "";
    });
    addStepBtn.addEventListener("click", () => {
      if (!state.selectedSequenceId) return alert("Please select a sequence.");
      const steps = state.sequence_steps.filter(
        (s) => s.sequence_id === state.selectedSequenceId
      );
      const nextNum =
        steps.length > 0 ? Math.max(...steps.map((s) => s.step_number)) + 1 : 1;
      showModal(
        "Add Sequence Step",
        `<label>Step Number</label><input type="number" id="modal-step-number" value="${nextNum}" required><label>Type</label><input type="text" id="modal-step-type" required placeholder="e.g., Email, Call, LinkedIn"><label>Subject (for Email)</label><input type="text" id="modal-step-subject" placeholder="Optional"><label>Message (for Email/Notes)</label><textarea id="modal-step-message" placeholder="Optional"></textarea><label>Delay (Days after previous step)</label><input type="number" id="modal-step-delay" value="0" required>`,
        async () => {
          const newStep = {
            sequence_id: state.selectedSequenceId,
            step_number: parseInt(
              document.getElementById("modal-step-number").value
            ),
            type: document.getElementById("modal-step-type").value.trim(),
            subject: document.getElementById("modal-step-subject").value.trim(),
            message: document.getElementById("modal-step-message").value.trim(),
            delay_days: parseInt(
              document.getElementById("modal-step-delay").value
            )
          };
          if (!newStep.type) {
            alert("Step Type is required.");
            return;
          }
          await supabase.from("sequence_steps").insert([newStep]);
          await loadAllData();
          hideModal();
        }
      );
    });
    logActivityBtn.addEventListener("click", () => {
      if (!state.selectedContactId) return alert("Please select a contact.");
      showModal(
        "Log Activity",
        `<label>Activity Type</label><input type="text" id="modal-activity-type" required placeholder="e.g., Call, Email, Meeting"><label>Description</label><textarea id="modal-activity-desc" required placeholder="Details of the activity"></textarea>`,
        async () => {
          const contact = state.contacts.find(
            (c) => c.id === state.selectedContactId
          );
          const newActivity = {
            contact_id: state.selectedContactId,
            account_id: contact ? contact.account_id : null,
            date: new Date().toISOString(),
            type: document.getElementById("modal-activity-type").value.trim(),
            description: document
              .getElementById("modal-activity-desc")
              .value.trim(),
            user_id: state.currentUser.id
          };
          if (!newActivity.type || !newActivity.description) {
            alert("All fields are required.");
            return;
          }
          await supabase.from("activities").insert([newActivity]);
          await loadAllData();
          alert("Activity logged!");
          hideModal();
        }
      );
    });
    assignSequenceBtn.addEventListener("click", () => {
      if (!state.selectedContactId) return alert("Please select a contact.");
      const isAlreadyInSequence = state.contact_sequences.some(
        (cs) =>
        cs.contact_id === state.selectedContactId && cs.status === "Active"
      );
      if (isAlreadyInSequence) {
        alert("This contact is already in an active sequence.");
        return;
      }
      const optionsHtml = state.sequences
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join("");
      if (!optionsHtml) return alert("No sequences found.");
      showModal(
        "Assign Sequence",
        `<label>Select a sequence:</label><select id="modal-sequence-select">${optionsHtml}</select>`,
        async () => {
          const sequenceId = Number(
            document.getElementById("modal-sequence-select").value
          );
          const steps = state.sequence_steps.filter(
            (s) => s.sequence_id === sequenceId
          );
          if (steps.length === 0) {
            alert("Cannot assign an empty sequence.");
            return;
          }
          const firstStep = steps.sort(
            (a, b) => a.step_number - b.step_number
          )[0];
          const newEnrollment = {
            user_id: state.currentUser.id,
            contact_id: state.selectedContactId,
            sequence_id: sequenceId,
            current_step_number: firstStep.step_number,
            status: "Active",
            last_completed_date: new Date().toISOString(),
            next_step_due_date: addDays(
              new Date(),
              firstStep.delay_days
            ).toISOString()
          };
          await supabase.from("contact_sequences").insert([newEnrollment]);
          alert("Sequence assigned!");
          await loadAllData();
          hideModal();
        }
      );
    });
    removeFromSequenceBtn.addEventListener("click", async () => {
      if (!state.selectedContactId) return;
      showModal(
        "Confirm Removal",
        "Are you sure you want to remove this contact from the sequence?",
        async () => {
          await supabase
            .from("contact_sequences")
            .delete()
            .eq("contact_id", state.selectedContactId)
            .eq("status", "Active");
          await loadAllData();
          alert("Contact removed from sequence.");
          hideModal();
        }
      );
    });
    dashboardTable.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.classList.contains("complete-step-btn")) {
        completeStep(Number(t.dataset.id));
      } else if (t.classList.contains("send-email-btn")) {
        const csId = Number(t.dataset.csId);
        const contactId = Number(t.dataset.contactId);
        const subject = decodeURIComponent(t.dataset.subject);
        let message = decodeURIComponent(t.dataset.message);
        const contact = state.contacts.find((c) => c.id === contactId);
        if (!contact) return alert("Contact not found.");
        message = message.replace(/{{firstName}}/g, contact.first_name);
        const mailtoLink = `mailto:${
         contact.email
       }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
         message
       )}`;
        window.open(mailtoLink, "_blank");
        completeStep(csId);
      } else if (t.classList.contains("linkedin-step-btn")) {
        const csId = Number(t.dataset.id);
        window.open("https://www.linkedin.com/feed/", "_blank");
        completeStep(csId);
      }
    });
    addDealBtn.addEventListener("click", () => {
      if (!state.selectedAccountId)
        return alert("Please select an account first.");
      showModal(
        "Create New Deal",
        `<label>Deal Name</label><input type="text" id="modal-deal-name" required><label>Stage</label><select id="modal-deal-stage"><option>Discovery</option><option>Proposal</option><option>Negotiation</option><option>Closed Won</option><option>Closed Lost</option></select><label>Term</label><input type="text" id="modal-deal-term"><label>Products</label><input type="text" id="modal-deal-products"><label>Monthly Recurring Charge (MRC)</label><input type="number" id="modal-deal-mrc" required><label>Estimated Close Month</label><input type="date" id="modal-deal-close">`,
        async () => {
          const newDeal = {
            user_id: state.currentUser.id,
            account_id: state.selectedAccountId,
            name: document.getElementById("modal-deal-name").value,
            stage: document.getElementById("modal-deal-stage").value,
            mrc: parseFloat(document.getElementById("modal-deal-mrc").value),
            close_month: document.getElementById("modal-deal-close").value,
            term: document.getElementById("modal-deal-term").value,
            products: document.getElementById("modal-deal-products").value
          };
          if (!newDeal.name || isNaN(newDeal.mrc)) {
            alert("Deal Name and MRC are required.");
            return;
          }
          await supabase.from("deals").insert([newDeal]);
          await loadAllData();
          hideModal();
        }
      );
    });
    dealsTable.querySelector("thead").addEventListener("click", (e) => {
      const th = e.target.closest("th");
      if (!th || !th.classList.contains("sortable")) return;
      const sortKey = th.dataset.sort;
      if (state.dealsSortBy === sortKey) {
        state.dealsSortDir = state.dealsSortDir === "asc" ? "desc" : "asc";
      } else {
        state.dealsSortBy = sortKey;
        state.dealsSortDir = "asc";
      }
      renderDealsPage();
    });
    document.addEventListener("change", async (e) => {
      if (e.target.classList.contains("commit-deal-checkbox")) {
        const dealId = Number(e.target.dataset.dealId);
        const is_committed = e.target.checked;
        await supabase.from("deals").update({
          is_committed
        }).eq("id", dealId);
        await loadAllData();
      }
    });
    document.addEventListener("click", async (e) => {
      if (e.target.classList.contains("edit-deal-btn")) {
        const dealId = Number(e.target.dataset.dealId);
        const deal = state.deals.find((d) => d.id === dealId);
        if (!deal) return;
        showModal(
          "Edit Deal",
          `<input type="hidden" id="modal-edit-deal-id" value="${
           deal.id
         }"><label>Deal Name</label><input type="text" id="modal-edit-deal-name" value="${
           deal.name || ""
         }" required><label>Stage</label><select id="modal-edit-deal-stage"><option>Discovery</option><option>Proposal</option><option>Negotiation</option><option>Closed Won</option><option>Closed Lost</option></select><label>Term</label><input type="text" id="modal-edit-deal-term" value="${
           deal.term || ""
         }"><label>Products</label><input type="text" id="modal-edit-deal-products" value="${
           deal.products || ""
         }"><label>Monthly Recurring Charge (MRC)</label><input type="number" id="modal-edit-deal-mrc" value="${
           deal.mrc || 0
         }" required><label>Estimated Close Month</label><input type="date" id="modal-edit-deal-close" value="${
           deal.close_month || ""
         }">`,
          async () => {
            const updatedDeal = {
              name: document.getElementById("modal-edit-deal-name").value,
              stage: document.getElementById("modal-edit-deal-stage").value,
              mrc: parseFloat(
                document.getElementById("modal-edit-deal-mrc").value
              ),
              close_month: document.getElementById("modal-edit-deal-close")
                .value,
              term: document.getElementById("modal-edit-deal-term").value,
              products: document.getElementById("modal-edit-deal-products")
                .value
            };
            if (!updatedDeal.name || isNaN(updatedDeal.mrc)) {
              alert("Deal Name and MRC are required.");
              return;
            }
            await supabase.from("deals").update(updatedDeal).eq("id", deal.id);
            await loadAllData();
            hideModal();
          }
        );
        document.getElementById("modal-edit-deal-stage").value = deal.stage;
      }
    });
    document
      .getElementById("account-contacts-list")
      .addEventListener("click", (e) => {
        const targetLink = e.target.closest(".contact-name-link");
        if (targetLink) {
          const contactId = Number(targetLink.dataset.contactId);
          if (contactId) {
            state.selectedContactId = contactId;
            navButtons.forEach((button) => button.classList.remove("active"));
            document
              .querySelector('[data-target="contacts"]')
              .classList.add("active");
            contentViews.forEach((view) =>
              view.classList.toggle("active-view", view.id === "contacts")
            );
            render();
          }
        }
      });
    document.getElementById("deals-table").addEventListener("click", (e) => {
      const targetLink = e.target.closest(".deal-name-link");
      if (targetLink) {
        const dealId = Number(targetLink.dataset.dealId);
        const deal = state.deals.find((d) => d.id === dealId);
        if (deal && deal.account_id) {
          state.selectedAccountId = deal.account_id;
          navButtons.forEach((button) => button.classList.remove("active"));
          document
            .querySelector('[data-target="accounts"]')
            .classList.add("active");
          contentViews.forEach((view) =>
            view.classList.toggle("active-view", view.id === "accounts")
          );
          render();
        }
      }
    });
    document
      .querySelector("#all-tasks-table tbody")
      .addEventListener("click", async (e) => {
        const targetButton = e.target.closest(".revisit-step-btn");
        if (targetButton) {
          const csId = Number(targetButton.dataset.csId);
          const contactSequence = state.contact_sequences.find(
            (cs) => cs.id === csId
          );
          if (contactSequence) {
            const newStepNumber = Math.max(
              1,
              contactSequence.current_step_number - 1
            );
            showModal(
              "Revisit Step",
              `Are you sure you want to revisit step ${newStepNumber} for this sequence?`,
              async () => {
                await supabase
                  .from("contact_sequences")
                  .update({
                    current_step_number: newStepNumber,
                    next_step_due_date: new Date().toISOString(),
                    status: "Active"
                  })
                  .eq("id", csId);
                await loadAllData();
                alert("Sequence step updated successfully!");
                hideModal();
              }
            );
          }
        }
      });
  }

  // --- APP INITIALIZATION ---
  function initializeApp() {
    setupAuthEventListeners();
    let isCrmInitialized = false;

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('crm-theme') || 'dark';
    const savedThemeIndex = themes.indexOf(savedTheme);
    currentThemeIndex = savedThemeIndex !== -1 ? savedThemeIndex : 0;
    applyTheme(themes[currentThemeIndex]);

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event fired:", event);

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        state.currentUser = session.user;
        authContainer.classList.add("hidden");
        crmContainer.classList.remove("hidden");

        if (!isCrmInitialized) {
          setupCrmEventListeners();
          isCrmInitialized = true;
        }
        await loadAllData();
      } else if (event === "SIGNED_OUT") {
        state.currentUser = null;
        authContainer.classList.remove("hidden");
        crmContainer.classList.add("hidden");

        isCrmInitialized = false;
        // Clear state arrays
        Object.keys(state).forEach((key) => {
          if (Array.isArray(state[key])) {
            state[key] = [];
          }
        });
        render();
      }
    });
  }

  // Start the application
  initializeApp();
});
