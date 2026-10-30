// Shows a plain message if the app bundle fails to start (kept as a file so the CSP can forbid inline scripts).
window.addEventListener("error",function(e){var r=document.getElementById("root");if(r&&!r.firstChild){r.textContent="The ARES\u201926 site could not start. Please refresh the page or try again later."}});
