const scene = document.querySelector("#scene");
const tilt = document.querySelector("#tilt");
const card = document.querySelector("#card");
const faceLogin = document.querySelector("#face-login");
const faceSignup = document.querySelector("#face-signup");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// ---------- Background: floating 3D X and O pieces ----------

const pieces = [
    // type, x%, y%, size px, depth px, base color
    ["x",  8, 14,  90, -200, "#cc7466"],
    ["o", 78,  8, 120, -350, "#ffc8dd"],
    ["o", 14, 70, 110, -150, "#ffc8dd"],
    ["x", 86, 62, 100, -100, "#cc7466"],
    ["o", 46,  4,  60, -500, "#cc7466"],
    ["x", 60, 82,  70, -300, "#ffc8dd"],
    ["x", 30, 40,  50, -650, "#ffc8dd"],
    ["o", 92, 34,  56, -550, "#cc7466"],
    ["x",  2, 44,  64, -420, "#ffc8dd"],
    ["o", 36, 88,  80, -250, "#cc7466"],
];

const LAYERS = 16;

const buildPiece = ([type, x, y, size, z, color], i) => {
    const piece = document.createElement("div");
    piece.className = `piece piece-${type}`;
    piece.style.setProperty("--x", `${x}%`);
    piece.style.setProperty("--y", `${y}%`);
    piece.style.setProperty("--s", `${size}px`);
    piece.style.setProperty("--z", `${z}px`);
    piece.style.setProperty("--delay", `${-i * 1.7}s`);
    piece.style.setProperty("--float-dur", `${7 + (i % 4) * 1.5}s`);
    piece.style.setProperty("--spin-dur", `${14 + (i % 5) * 4}s`);
    piece.style.setProperty("--spin-dir", i % 2 ? "reverse" : "normal");
    piece.style.setProperty("--tilt", `${10 + (i % 3) * 15}deg`);

    const spin = document.createElement("div");
    spin.className = "piece-spin";

    // Stack slices along Z; darker toward the back so the piece reads as solid.
    const depth = size * 0.18;
    for (let l = 0; l < LAYERS; l++) {
        const layer = document.createElement("span");
        layer.className = "layer";
        const t = l / (LAYERS - 1);
        layer.style.setProperty("--lz", `${depth / 2 - t * depth}px`);
        const dark = l === 0 ? 0 : 25 + t * 30;
        layer.style.setProperty("--shade", `color-mix(in srgb, ${color}, #000 ${dark}%)`);
        spin.appendChild(layer);
    }

    piece.appendChild(spin);
    return piece;
};

pieces.forEach((p, i) => scene.appendChild(buildPiece(p, i)));

// ---------- Pointer parallax + card tilt ----------

if (!reduceMotion && finePointer) {
    let frame = null;
    let lastEvent = null;

    const update = () => {
        frame = null;
        const e = lastEvent;
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        scene.style.setProperty("--px", `${nx * 12}deg`);
        scene.style.setProperty("--py", `${-ny * 12}deg`);

        const rect = tilt.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        const clamp = (v) => Math.max(-1, Math.min(1, v));
        tilt.style.setProperty("--ry", `${clamp(cx) * 6}deg`);
        tilt.style.setProperty("--rx", `${-clamp(cy) * 6}deg`);

        // When flipped the back face is mirrored, so mirror the glare too.
        const gx = card.classList.contains("flipped") ? 0.5 - cx : cx + 0.5;
        card.style.setProperty("--gx", `${gx * 100}%`);
        card.style.setProperty("--gy", `${(cy + 0.5) * 100}%`);
    };

    window.addEventListener("pointermove", (e) => {
        lastEvent = e;
        if (!frame) frame = requestAnimationFrame(update);
    });

    document.addEventListener("pointerleave", () => {
        tilt.style.setProperty("--rx", "0deg");
        tilt.style.setProperty("--ry", "0deg");
    });
}

// ---------- Flip between sign in and sign up ----------

const showFace = (name) => {
    const toSignup = name === "signup";
    card.classList.toggle("flipped", toSignup);
    faceLogin.inert = toSignup;
    faceSignup.inert = !toSignup;

    const target = toSignup ? faceSignup : faceLogin;
    const focusFirst = () => target.querySelector("input").focus({ preventScroll: true });
    if (reduceMotion) focusFirst();
    else setTimeout(focusFirst, 450);
};

document.querySelectorAll("[data-flip]").forEach((btn) => {
    btn.addEventListener("click", () => showFace(btn.dataset.flip));
});

// ---------- Show / hide password ----------

document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
        const input = btn.previousElementSibling;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Hide" : "Show";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        btn.setAttribute("aria-pressed", String(show));
    });
});

// ---------- Validation + submit ----------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rules = {
    name: (v) => (v.trim().length >= 2 ? "" : "Player name needs at least 2 characters."),
    email: (v) => (EMAIL.test(v.trim()) ? "" : "Enter a valid email address."),
    password: (v) => (v.length >= 8 ? "" : "Password must be at least 8 characters."),
};

const setError = (input, message) => {
    const error = document.querySelector(`#${input.id}-error`);
    error.textContent = message;
    if (message) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", error.id);
    } else {
        input.removeAttribute("aria-invalid");
    }
};

const validate = (form) => {
    let firstInvalid = null;
    form.querySelectorAll("input[name]:not([type=checkbox])").forEach((input) => {
        const message = rules[input.name](input.value);
        setError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
};

// Clear an error as soon as the field becomes valid.
document.querySelectorAll("form input[name]:not([type=checkbox])").forEach((input) => {
    input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true" && !rules[input.name](input.value)) {
            setError(input, "");
        }
    });
});

const handleSubmit = (form) => (e) => {
    e.preventDefault();
    const invalid = validate(form);
    if (invalid) {
        invalid.focus();
        return;
    }

    const btn = form.querySelector(".btn-primary");
    const status = form.querySelector(".status");
    btn.setAttribute("aria-busy", "true");
    btn.disabled = true;
    status.textContent = "";

    const data = new FormData(form);
    const player = (data.get("name") || data.get("email").split("@")[0]).trim();

    // No backend yet: simulate the request, then head to the game.
    setTimeout(() => {
        btn.removeAttribute("aria-busy");
        status.textContent = `Welcome, ${player}! Loading the board…`;
        try {
            sessionStorage.setItem("ttt-player", player);
        } catch (err) {
            // Storage can be unavailable (private mode); the redirect still works.
        }
        if (reduceMotion) {
            window.location.href = "index.html";
            return;
        }
        tilt.classList.add("leaving");
        tilt.addEventListener("animationend", () => {
            window.location.href = "index.html";
        }, { once: true });
    }, 1100);
};

document.querySelector("#login-form").addEventListener("submit", handleSubmit(document.querySelector("#login-form")));
document.querySelector("#signup-form").addEventListener("submit", handleSubmit(document.querySelector("#signup-form")));
