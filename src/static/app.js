document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        // store metadata on the card for easy updates
        activityCard.dataset.activity = name;
        activityCard.dataset.max = details.max_participants;
        activityCard.dataset.count = details.participants.length;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list safely using textContent and add delete buttons
        const ul = activityCard.querySelector('.participants-list');
        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = p;

            const delBtn = document.createElement('button');
            delBtn.className = 'participant-delete';
            delBtn.title = 'Remove participant';
            delBtn.innerHTML = '✖';

            // Delete handler
            delBtn.addEventListener('click', async () => {
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  { method: 'DELETE' }
                );
                const resJson = await resp.json();
                if (resp.ok) {
                  // Remove from local details and UI
                  const idx = details.participants.findIndex(x => x === p || x.trim().toLowerCase() === p.trim().toLowerCase());
                  if (idx !== -1) details.participants.splice(idx, 1);
                  li.remove();

                  // Update dataset count on the card (don't overwrite if frontend added participants)
                  activityCard.dataset.count = Math.max(0, Number(activityCard.dataset.count) - 1);

                  // If no participants left, show placeholder
                  if (details.participants.length === 0) {
                    const emptyLi = document.createElement('li');
                    emptyLi.textContent = 'No participants yet';
                    emptyLi.className = 'empty';
                    ul.appendChild(emptyLi);
                  }

                  // Update availability display
                  const avail = activityCard.querySelector('.availability');
                  const newSpots = Number(activityCard.dataset.max) - Number(activityCard.dataset.count);
                  avail.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;

                  // Show success message
                  messageDiv.textContent = resJson.message;
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                } else {
                  messageDiv.textContent = resJson.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                }
              } catch (err) {
                console.error('Error removing participant', err);
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.textContent = 'No participants yet';
          li.className = 'empty';
          ul.appendChild(li);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Update the activity card immediately without refresh
        addParticipantToCard(activity, email);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Helper: add participant to activity card in the DOM
  function addParticipantToCard(activityName, email) {
    // find card by data-activity
    const cards = activitiesList.querySelectorAll('.activity-card');
    let card = null;
    cards.forEach(c => {
      if (c.dataset.activity === activityName) card = c;
    });
    if (!card) return;

    const ul = card.querySelector('.participants-list');

    // remove empty placeholder if present
    const empty = ul.querySelector('li.empty');
    if (empty) empty.remove();

    // create participant item similar to initial render
    const li = document.createElement('li');
    li.className = 'participant-item';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = email;

    const delBtn = document.createElement('button');
    delBtn.className = 'participant-delete';
    delBtn.title = 'Remove participant';
    delBtn.innerHTML = '✖';

    delBtn.addEventListener('click', async () => {
      if (!confirm(`Remove ${email} from ${activityName}?`)) return;
      try {
        const resp = await fetch(
          `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
          { method: 'DELETE' }
        );
        const resJson = await resp.json();
        if (resp.ok) {
          li.remove();

          // decrement count dataset
          card.dataset.count = Math.max(0, Number(card.dataset.count) - 1);

          // if no participants left, show placeholder
          if (Number(card.dataset.count) === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.textContent = 'No participants yet';
            emptyLi.className = 'empty';
            ul.appendChild(emptyLi);
          }

          // update availability
          const avail = card.querySelector('.availability');
          const newSpots = Number(card.dataset.max) - Number(card.dataset.count);
          avail.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;

          messageDiv.textContent = resJson.message;
          messageDiv.className = 'success';
          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        } else {
          messageDiv.textContent = resJson.detail || 'Failed to remove participant';
          messageDiv.className = 'error';
          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        }
      } catch (err) {
        console.error('Error removing participant', err);
      }
    });

    li.appendChild(nameSpan);
    li.appendChild(delBtn);
    ul.appendChild(li);

    // increment count dataset and update availability
    card.dataset.count = Number(card.dataset.count) + 1;
    const avail = card.querySelector('.availability');
    const newSpots = Number(card.dataset.max) - Number(card.dataset.count);
    avail.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;
  }

  // Initialize app
  fetchActivities();
});
