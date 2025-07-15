const form = document.getElementById("applicationForm");
const submitButton = document.querySelector('button[type="submit"]');

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitButton.disabled = true;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/submit-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.text();
        alert(result);
        form.reset();
      } else {
        alert("Ошибка при отправке заявки");
      }
    } catch (error) {
      console.error("Ошибка при отправке:", error);
      alert("Произошла ошибка при отправке");
    } finally {
      submitButton.disabled = false;
    }
  });
}

const phoneInput = document.querySelector('input[name="phone"]');
if (phoneInput) {
  phoneInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    e.target.value = value;
  });
}
