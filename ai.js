
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4";

const MODEL_ID = "onnx-community/SmolLM2-135M-Instruct";
let generatorPromise = null;

const form = document.getElementById("aiPlannerForm");
const subjectsInput = document.getElementById("aiSubjects");
const hoursInput = document.getElementById("aiHours");
const deadlinesInput = document.getElementById("aiDeadlines");
const status = document.getElementById("aiPlanStatus");
const resultBox = document.getElementById("aiPlanResult");
const generateButton = document.getElementById("generatePlan");

// Create a reliable timetable using JavaScript.

function createTimetable(subjects, hours, deadlines) {
    const totalMinutes = hours * 60;

    // Find subjects mentioned in the deadline.
    const deadlineText = deadlines.toLowerCase();

    const prioritySubjects = subjects.filter(subject =>
        deadlineText.includes(subject.toLowerCase()) ||
        (subject.toLowerCase() === "mathematics" &&
         /\bmaths\b|\bmath\b/.test(deadlineText))
    );

    // Give priority subjects a larger share.
    const weights = subjects.map(subject =>
        prioritySubjects.includes(subject) ? 2 : 1
    );

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    const allocations = weights.map(weight =>
        Math.floor(totalMinutes * weight / totalWeight)
    );

    // Distribute any remaining minutes.
    let remaining = totalMinutes -
        allocations.reduce((sum, value) => sum + value, 0);

    for (let i = 0; remaining > 0; i = (i + 1) % allocations.length) {
        allocations[i]++;
        remaining--;
    }

    // Split each subject's time into sessions of up to 50 minutes.
    const sessions = [];

    subjects.forEach((subject, index) => {
        let subjectMinutes = allocations[index];

        while (subjectMinutes > 0) {
            const duration = Math.min(50, subjectMinutes);

            sessions.push({
                subject,
                duration
            });

            subjectMinutes -= duration;
        }
    });

    let plan = "YOUR DAILY STUDY TIMETABLE\n\n";

    sessions.forEach((session, index) => {
        plan += `Session ${index + 1}: ${session.subject} - ${session.duration} minutes\n`;

        if (index < sessions.length - 1) {
            plan += "Break: 10 minutes\n";
        }
    });

    plan += `\nTOTAL STUDY TIME: ${hours} hours\n`;

    if (prioritySubjects.length > 0) {
        plan += `PRIORITY SUBJECTS: ${prioritySubjects.join(", ")}\n`;
    }

    return plan;
}


// Ask the open-source AI for one short study tip.
async function getAITip(subjects, deadlines) {
    try {
        if (!generatorPromise) {
            generatorPromise = pipeline(
                "text-generation",
                MODEL_ID,
                { dtype: "q4" }
            );
        }

        const generator = await generatorPromise;

        const messages = [
            {
                role: "system",
                content: "You are a helpful student study coach. Give exactly one short, practical study tip. Do not repeat the question. Do not invent dates or facts."
            },
            {
                role: "user",
                content: `Give one useful study tip for these subjects: ${subjects}. Upcoming deadline: ${deadlines}.`
            }
        ];

        const output = await generator(messages, {
            max_new_tokens: 60,
            do_sample: false,
            repetition_penalty: 1.2
        });

        const generated = output[0].generated_text;

        const answer = Array.isArray(generated)
            ? generated[generated.length - 1].content
            : generated;

        const tip = String(answer).trim();

        // Reject repetitive or excessively long answers.
        if (
            tip.length < 15 ||
            tip.length > 250 ||
            /repeat the question|as an ai|date constraints/i.test(tip)
        ) {
            return null;
        }

        return tip;

    } catch (error) {
        console.error("AI tip error:", error);
        generatorPromise = null;
        return null;
    }
}

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const subjects = subjectsInput.value
            .split(",")
            .map(subject => subject.trim())
            .filter(Boolean);

        const hours = Number(hoursInput.value);
        const deadlines = deadlinesInput.value.trim() ||
            "No upcoming deadlines provided.";

        if (subjects.length === 0 || hours < 1 || hours > 12) {
            status.textContent = "Please enter valid subjects and study hours.";
            return;
        }

        generateButton.disabled = true;
        resultBox.textContent = "";

        try {
            status.textContent = "Creating your study timetable...";

            // JavaScript creates the timetable.
           let plan = createTimetable(subjects, hours, deadlines);

            plan += "\nPRIORITY\n";
            plan += `Pay extra attention to subjects with upcoming deadlines: ${deadlines}\n`;

            status.textContent = "Getting personalised advice from StudyFlow AI...";

            // Open-source AI adds a study tip.
            const tip = await getAITip(subjects, deadlines);

            plan += "\nSTUDY ADVICE\n";

            if (tip) {
                plan += tip;
            } else {
                plan += "Revise difficult topics regularly and practise questions after each study session.";
            }

            resultBox.textContent = plan;
            resultBox.style.whiteSpace = "pre-wrap";

            status.textContent = "Your study plan is ready!";

        } catch (error) {
            console.error("StudyFlow error:", error);
            status.textContent = "Something went wrong. Please try again.";

        } finally {
            generateButton.disabled = false;
        }
    });
}
