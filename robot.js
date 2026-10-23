// Builds a 3D robot out of CSS cuboids and exposes a tiny API
// (robot.look / robot.mood / robot.say) for game.js to drive.

const robot = (() => {
    const bot = document.querySelector("#bot");
    const says = document.querySelector("#bot-says");

    // A box with six faces; the element's origin sits at its centre.
    const cuboid = (className, w, h, d) => {
        const box = document.createElement("div");
        box.className = `cuboid ${className}`;
        box.style.setProperty("--w", `${w}px`);
        box.style.setProperty("--h", `${h}px`);
        box.style.setProperty("--d", `${d}px`);
        ["front", "back", "right", "left", "top", "bottom"].forEach((side) => {
            const face = document.createElement("div");
            face.className = `face face-${side}`;
            box.appendChild(face);
        });
        return box;
    };

    const part = (className, ...children) => {
        const el = document.createElement("div");
        el.className = className;
        children.forEach((c) => el.appendChild(c));
        return el;
    };

    const head = cuboid("head-box", 120, 92, 96);
    head.querySelector(".face-front").innerHTML =
        '<span class="eye"></span><span class="eye"></span><span class="mouth"></span>';
    const antenna = part("antenna", cuboid("antenna-rod", 6, 34, 6), part("antenna-ball"));
    const headPivot = part("bot-head", part("head-look", head, antenna,
        part("ear left", cuboid("ear-box", 14, 36, 36)),
        part("ear right", cuboid("ear-box", 14, 36, 36))));

    const torso = cuboid("torso-box", 150, 130, 84);
    torso.querySelector(".face-front").innerHTML =
        '<span class="core"></span><span class="vent"></span><span class="vent"></span>';

    // Outer element places the shoulder, inner one swings from it.
    const arm = (side) => part(`bot-arm ${side}`, part("arm-swing",
        cuboid("arm-box", 30, 96, 30),
        part("hand", cuboid("hand-box", 38, 30, 38))));

    bot.append(
        headPivot,
        part("bot-neck", cuboid("neck-box", 40, 22, 40)),
        part("bot-torso", torso),
        arm("left"),
        arm("right"),
        part("bot-base", cuboid("base-box", 96, 26, 70)),
        part("thruster")
    );

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Turn the head toward a board cell (0-8).
    const look = (index) => {
        if (index === null) {
            bot.style.removeProperty("--look-x");
            bot.style.removeProperty("--look-y");
            return;
        }
        const col = index % 3;
        const row = Math.floor(index / 3);
        bot.style.setProperty("--look-y", `${(col - 1) * 28 + 20}deg`);
        bot.style.setProperty("--look-x", `${(1 - row) * 14}deg`);
    };

    const mood = (name) => {
        bot.dataset.mood = name;
    };

    const say = (text) => {
        says.textContent = text;
    };

    // Follow the pointer gently while idle.
    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener("pointermove", (e) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            bot.style.setProperty("--sway", `${nx * 30}deg`);
        });
    }

    return { look, mood, say };
})();
