window.addEventListener("pageshow", () => {
  const page = document.body?.dataset?.page;
  if (page === "login" || page === "system-login") {
    const form = document.getElementById(page === "login" ? "loginForm" : "systemLoginForm");
    form?.reset();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body?.dataset?.page;

  const clearAuthFieldErrors = (form) => {
    form?.querySelectorAll("input").forEach((input) => {
      input.classList.remove("invalid");
      input.setAttribute("aria-invalid", "false");
    });

    form?.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
  };

  const showAuthFieldError = (form, fieldName, message) => {
    const input = form?.querySelector(`[name="${fieldName}"]`);
    const errorNode = form?.querySelector(`[data-error-for="${fieldName}"]`);

    input?.classList.add("invalid");
    input?.setAttribute("aria-invalid", "true");
    if (errorNode) {
      errorNode.textContent = message;
    }
  };

  const validateAuthForm = (form, payload) => {
    const errors = [];
    const email = (payload.email || "").trim();
    const password = (payload.password || "").trim();
    const name = (payload.name || "").trim();

    if (!email) {
      errors.push({ field: "email", message: "Email is required." });
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push({ field: "email", message: "Enter a valid email address." });
    }

    if (!password) {
      errors.push({ field: "password", message: "Password is required." });
    } else if (password.length < 6) {
      errors.push({ field: "password", message: "Password must be at least 6 characters." });
    }

    if (form?.querySelector('[name="name"]') && !name) {
      errors.push({ field: "name", message: "Full name is required." });
    }

    return errors;
  };

  if (page === "login") {
    const form = document.getElementById("loginForm");
    const message = document.getElementById("message");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      clearAuthFieldErrors(form);

      const errors = validateAuthForm(form, payload);
      if (errors.length) {
        errors.forEach((error) => showAuthFieldError(form, error.field, error.message));
        message.textContent = errors[0].message;
        message.className = "message error";
        return;
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Unable to sign in");
        }

        message.textContent = "Signed in successfully.";
        message.className = "message success";
        window.location.href = "/dashboard";
      } catch (error) {
        message.textContent = error.message;
        message.className = "message error";
      }
    });
  }

  if (page === "register") {
    const form = document.getElementById("registerForm");
    const message = document.getElementById("message");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      clearAuthFieldErrors(form);

      const errors = validateAuthForm(form, payload);
      if (errors.length) {
        errors.forEach((error) => showAuthFieldError(form, error.field, error.message));
        message.textContent = errors[0].message;
        message.className = "message error";
        return;
      }

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Unable to create account");
        }

        message.textContent = "Account created successfully.";
        message.className = "message success";
        window.location.href = "/dashboard";
      } catch (error) {
        message.textContent = error.message;
        message.className = "message error";
      }
    });
  }

  if (page === "system-login") {
    const form = document.getElementById("systemLoginForm");
    const message = document.getElementById("message");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      clearAuthFieldErrors(form);

      const errors = validateAuthForm(form, payload);
      if (errors.length) {
        errors.forEach((error) => showAuthFieldError(form, error.field, error.message));
        message.textContent = errors[0].message;
        message.className = "message error";
        return;
      }

      try {
        const response = await fetch("/api/auth/system/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Unable to sign in as system user");
        }

        message.textContent = "System user signed in.";
        message.className = "message success";
        window.location.href = "/system/dashboard";
      } catch (error) {
        message.textContent = error.message;
        message.className = "message error";
      }
    });
  }

  if (page === "system-dashboard") {
    const message = document.getElementById("message");
    const userSelect = document.getElementById("userSelect");
    const accountSelect = document.getElementById("accountSelect");
    const userList = document.getElementById("userList");
    const fundingForm = document.getElementById("systemFundingForm");
    const logoutBtn = document.getElementById("logoutBtn");

    const showMessage = (text, type = "success") => {
      message.textContent = text;
      message.className = `message ${type}`;
    };

    const loadUsers = async () => {
      try {
        const response = await fetch("/api/system/users", { credentials: "include" });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = "/system/login";
            return;
          }
          throw new Error("Unable to load users");
        }

        const data = await response.json();
        const users = data.users || [];

        userList.innerHTML = "";
        userSelect.innerHTML = users.map((user) => `<option value="${user._id}">${user.name} (${user.email})</option>`).join("");

        users.forEach((user) => {
          const item = document.createElement("li");
          item.textContent = `${user.name} — ${user.email}`;
          userList.appendChild(item);
        });

        if (users.length) {
          await loadAccounts(users[0]._id);
        } else {
          accountSelect.innerHTML = "<option value=''>No accounts</option>";
        }
      } catch (error) {
        showMessage(error.message, "error");
      }
    };

    const loadAccounts = async (userId) => {
      try {
        const response = await fetch(`/api/system/users/${userId}/accounts`, { credentials: "include" });
        if (!response.ok) {
          throw new Error("Unable to load user accounts");
        }

        const data = await response.json();
        const accounts = data.accounts || [];
        accountSelect.innerHTML = accounts.map((account) => `<option value="${account._id}">${account._id} (${account.status || "ACTIVE"})</option>`).join("");

        if (!accounts.length) {
          accountSelect.innerHTML = "<option value=''>No accounts</option>";
        }
      } catch (error) {
        showMessage(error.message, "error");
      }
    };

    userSelect?.addEventListener("change", async () => {
      if (userSelect.value) {
        await loadAccounts(userSelect.value);
      }
    });

    fundingForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(fundingForm);
      const payload = {
        toAccount: formData.get("toAccount"),
        amount: Number(formData.get("amount")),
        idempotencyKey: `${Date.now()}-${Math.random().toString(16).slice(2)}`
      };

      try {
        const response = await fetch("/api/transactions/system/initial-funds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || "Unable to add initial funds");
        }

        showMessage("Initial funds added successfully.");
        fundingForm.reset();
        await loadUsers();
      } catch (error) {
        showMessage(error.message, "error");
      }
    });

    logoutBtn?.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } finally {
        window.location.href = "/system/login";
      }
    });

    loadUsers();
  }

  if (page === "dashboard") {
    const accountList = document.getElementById("accountList");
    const message = document.getElementById("message");
    const fromAccount = document.getElementById("fromAccount");
    const toAccount = document.getElementById("toAccount");
    const createAccountBtn = document.getElementById("createAccountBtn");
    const transferForm = document.getElementById("transferForm");
    const balanceForm = document.getElementById("balanceForm");
    const balanceMessage = document.getElementById("balanceMessage");
    const balanceResult = document.getElementById("balanceResult");
    const logoutBtn = document.getElementById("logoutBtn");

    const showMessage = (text, type = "success") => {
      message.textContent = text;
      message.className = `message ${type}`;
    };

    const showBalanceMessage = (text, type = "success") => {
      balanceMessage.textContent = text;
      balanceMessage.className = `message ${type}`;
    };

    const showBalanceResult = (text) => {
      balanceResult.textContent = text;
    };

    const populateAccounts = async () => {
      try {
        const response = await fetch("/api/accounts", {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("You need to sign in first.");
        }

        const data = await response.json();
        const accounts = data.accounts || [];

        accountList.innerHTML = "";
        if (accounts.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.textContent = "No accounts yet. Create one to get started.";
          accountList.appendChild(emptyItem);
        } else {
          accounts.forEach((account) => {
            const item = document.createElement("li");
            item.textContent = `${account._id} • ${account.status || "ACTIVE"}`;
            accountList.appendChild(item);
          });
        }

        const options = accounts.map((account) => `<option value="${account._id}">${account._id} (${account.status || "ACTIVE"})</option>`).join("");
        fromAccount.innerHTML = options;
        const balanceAccountSelect = document.getElementById("balanceAccountId");
        balanceAccountSelect.innerHTML = options;
      } catch (error) {
        showMessage("Unable to load accounts. Please try again.", "error");
        accountList.innerHTML = "";
      }
    };

    createAccountBtn?.addEventListener("click", async () => {
      try {
        const response = await fetch("/api/accounts", {
          method: "POST",
          credentials: "include"
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error("Unable to create account");
        }

        showMessage("Account created successfully.");
        await populateAccounts();
      } catch (error) {
        showMessage("Unable to create account. Please try again.", "error");
      }
    });

    transferForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = transferForm.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent;
      const formData = new FormData(transferForm);
      const payload = {
        fromAccount: formData.get("fromAccount"),
        toAccount: formData.get("toAccount")?.toString().trim(),
        amount: Number(formData.get("amount"))
      };

      if (!payload.toAccount) {
        showMessage("Please enter the destination account ID.", "error");
        return;
      }

      try {
        submitBtn?.setAttribute('disabled', '');
        submitBtn?.classList.add('loading');
        if (submitBtn) submitBtn.textContent = 'Sending...';

        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...payload,
            idempotencyKey: `${Date.now()}-${Math.random().toString(16).slice(2)}`
          })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error("Unable to process transfer");
        }

        showMessage("Transfer completed successfully.");
        await populateAccounts();
        transferForm.reset();
      } catch (error) {
        showMessage("Unable to process transfer. Please try again.", "error");
      } finally {
        submitBtn?.removeAttribute('disabled');
        submitBtn?.classList.remove('loading');
        if (submitBtn && originalText) submitBtn.textContent = originalText;
      }
    });

    balanceForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const accountId = new FormData(balanceForm).get("accountId")?.toString().trim();

      if (!accountId) {
        showBalanceMessage("Please select an account.", "error");
        showBalanceResult("");
        return;
      }

      try {
        const response = await fetch(`/api/accounts/balance/${accountId}`, {
          credentials: "include"
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error("Unable to load balance");
        }

        showBalanceMessage("Balance loaded successfully.");
        showBalanceResult(`Account ${result.accountId}: ${result.balance}`);
      } catch (error) {
        showBalanceMessage("Unable to check balance. Please try again.", "error");
        showBalanceResult("");
      }
    });

    logoutBtn?.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } finally {
        window.location.href = "/login";
      }
    });

    populateAccounts();
  }
});
