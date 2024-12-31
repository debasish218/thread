htmx.config.refreshOnHistoryMiss = true;
// This is bottom nav listening to be tabbed (which makes an htmx request), we have to listen all the time.
// find all mytabs in bottom nav
const allTabs = htmx.findAll(".mytab");
allTabs.forEach((tab) => {
  tab.addEventListener("htmx:beforeRequest", (evt) => {
    const reddot = htmx.find("#reddot");
    // Change tabs only if the request is not made by reddot checker
    if (reddot !== evt.detail.elt) {
      // gray all tabs
      for (let t of allTabs) {
        t.classList.remove("text-black");
        t.classList.add("text-gray-400");
      }
      // empty the container (optional for ux)
      htmx.find("#container").innerHTML = "";

      // Highlight the request dispatcher tab
      evt.detail.requestConfig.elt.classList.remove("text-gray-400");
      evt.detail.requestConfig.elt.classList.add("text-black");
    }
  });
});

// If the route go form "anywhere" to "accounts:profile", we have to listen only after the ptabs have been swapped into the template.
var profileTab = htmx.find("#profile-tab");
htmx.find("#container").addEventListener("htmx:afterSwap", (evt) => {
  if (evt.detail.requestConfig.elt === profileTab) {
    var pTabs = htmx.findAll(".ptab");
    // find alll ptabs in profile page
    pTabs.forEach((ptab) => {
      ptab.addEventListener("htmx:beforeRequest", (e) => {
        // abort the infinite scroll xhr requests if any
        const profileContainer = htmx.find("#profile-container");
        const pis = profileContainer.querySelectorAll(".profile-infinite");
        pis.forEach((pi) => {
          htmx.trigger(pi, "htmx:abort");
        });
        // empty the container (optional for ux)
        profileContainer.innerHTML = "";
        // toggle the ptabs
        for (let pt of pTabs) {
          pt.classList.remove("border-b-2", "border-black");
        }
        e.detail.requestConfig.elt.classList.add("border-b-2", "border-black");
      });
    });
  }
});

// If the route comes in at "accounts:profile" first, we have to listen the tab event of the ptabs right away.
var pTabs = htmx.findAll(".ptab");
// find alll ptabs in profile page
pTabs.forEach((ptab) => {
  ptab.addEventListener("htmx:beforeRequest", (e) => {
    // abort the infinite scroll xhr requests if any
    const profileContainer = htmx.find("#profile-container");
    const pis = profileContainer.querySelectorAll(".profile-infinite");
    pis.forEach((pi) => {
      htmx.trigger(pi, "htmx:abort");
    });
    // empty the container (optional for ux)
    profileContainer.innerHTML = "";
    // toggle the ptabs
    for (let pt of pTabs) {
      pt.classList.remove("border-b-2", "border-black");
    }
    e.detail.requestConfig.elt.classList.add("border-b-2", "border-black");
  });
});

document.addEventListener("htmx:pushedIntoHistory", (evt) => {
  localStorage.removeItem("htmx-history-cache");
});

document.addEventListener("htmx:historyRestore", (evt) => {
  localStorage.removeItem("htmx-history-cache");
  location.reload();
});
