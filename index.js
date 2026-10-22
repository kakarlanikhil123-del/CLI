// import express from "express";
// import { readFile } from "node:fs/promises";
// import { writeFile } from "node:fs";


// const app = express();
// const port = 5000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// function sendSuccess(res, data, status = 200) {
//     res.status(status).json({
//         success: true,
//         data
//     });
// }

// function sendError(res, status, code, message) {
//     res.status(status).json({
//         success: false,
//         error: {
//             code,
//             message
//         }
//     });
// }

// async function loadTasks() {
//     try {
//         const data = await readFile("message.txt", "utf-8");

//         try {
//             return JSON.parse(data);
//         } catch {
//             throw new Error("stored data is corrupt");
//         }

//     } catch (error) {

//         if (error.code === "ENOENT") {
//             return [];
//         }

//         throw error;
//     }
// }

// function saveTasks(tasks, callback) {
//     writeFile(
//         "tasks.json",
//         JSON.stringify(tasks, null, 2),
//         callback
//     );
// }

// app.get("/tasks", async (req, res) => {

//     try {

//         const tasks = await loadTasks();

//         sendSuccess(res, tasks);

//     } catch (error) {

//         sendError(
//             res,
//             500,
//             "CORRUPT_DATA",
//             error.message
//         );

//     }

// });

// app.get("/tasks/:id", (req, res) => {

//     loadTasks((error, tasks) => {

//         if (error) {
//             return sendError(
//                 res,
//                 500,
//                 "CORRUPT_DATA",
//                 error
//             );
//         }

//         const task = tasks.find(
//             task => task.id === Number(req.params.id)
//         );

//         if (!task) {
//             return sendError(
//                 res,
//                 404,
//                 "NOT_FOUND",
//                 "Task not found"
//             );
//         }

//         sendSuccess(res, task);

//     });

// });

// app.post("/tasks", (req, res) => {

//     if (!req.body?.title) {
//         return sendError(
//             res,
//             400,
//             "VALIDATION_ERROR",
//             "title is required"
//         );
//     }

//     loadTasks((error, tasks) => {

//         if (error) {
//             return sendError(
//                 res,
//                 500,
//                 "CORRUPT_DATA",
//                 error
//             );
//         }

//         const newTask = {
//             id: Date.now(),
//             title: req.body.title,
//             done: req.body.done ?? false
//         };

//         tasks.push(newTask);

//         saveTasks(tasks, (err) => {

//             if (err) {
//                 return sendError(
//                     res,
//                     500,
//                     "WRITE_ERROR",
//                     "Unable to save task"
//                 );
//             }

//             sendSuccess(res, newTask, 201);

//         });

//     });

// });

// app.patch("/tasks/:id", (req, res) => {

//     loadTasks((error, tasks) => {

//         if (error) {
//             return sendError(
//                 res,
//                 500,
//                 "CORRUPT_DATA",
//                 error
//             );
//         }

//         const task = tasks.find(
//             task => task.id === Number(req.params.id)
//         );

//         if (!task) {
//             return sendError(
//                 res,
//                 404,
//                 "NOT_FOUND",
//                 "Task not found"
//             );
//         }

//         if (
//             req.body.title !== undefined &&
//             req.body.title.trim() === ""
//         ) {
//             return sendError(
//                 res,
//                 400,
//                 "VALIDATION_ERROR",
//                 "title cannot be empty"
//             );
//         }

//         if (req.body.title !== undefined) {
//             task.title = req.body.title;
//         }

//         if (req.body.done !== undefined) {
//             task.done = req.body.done;
//         }

//         saveTasks(tasks, (err) => {

//             if (err) {
//                 return sendError(
//                     res,
//                     500,
//                     "WRITE_ERROR",
//                     "Unable to update task"
//                 );
//             }

//             sendSuccess(res, task);

//         });

//     });

// });

// app.delete("/tasks/:id", (req, res) => {

//     loadTasks((error, tasks) => {

//         if (error) {
//             return sendError(
//                 res,
//                 500,
//                 "CORRUPT_DATA",
//                 error
//             );
//         }

//         const task = tasks.find(
//             task => task.id === Number(req.params.id)
//         );

//         if (!task) {
//             return sendError(
//                 res,
//                 404,
//                 "NOT_FOUND",
//                 "Task not found"
//             );
//         }

//         const updatedTasks = tasks.filter(
//             task => task.id !== Number(req.params.id)
//         );

//         saveTasks(updatedTasks, (err) => {

//             if (err) {
//                 return sendError(
//                     res,
//                     500,
//                     "WRITE_ERROR",
//                     "Unable to delete task"
//                 );
//             }

//             res.status(204).send();

//         });

//     });

// });

// app.listen(port, () => {
//     console.log(`Running on port ${port}`);
// });

import express from "express";
import { readFile, writeFile } from "node:fs/promises";

const app = express();
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// Response Helpers
// =====================

function sendSuccess(res, data, status = 200) {
    return res.status(status).json({
        success: true,
        data
    });
}

function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: {
            code,
            message
        }
    });
}

// =====================
// File Helpers
// =====================

async function loadTasks() {
    try {
        const data = await readFile("tasks.json", "utf-8");

        try {
            return JSON.parse(data);
        } catch {
            const error = new Error("Stored data is corrupt");
            error.status = 500;
            error.code = "CORRUPT_DATA";
            throw error;
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        throw error;
    }
}

async function saveTasks(tasks) {
    await writeFile(
        "tasks.json",
        JSON.stringify(tasks, null, 2)
    );
}

// =====================
// GET ALL TASKS
// =====================

app.get("/tasks", async (req, res, next) => {
    try {
        const tasks = await loadTasks();
        sendSuccess(res, tasks);
    } catch (error) {
        next(error);
    }
});

// =====================
// GET ONE TASK
// =====================

app.get("/tasks/:id", async (req, res, next) => {
    try {
        const tasks = await loadTasks();

        const task = tasks.find(
            task => task.id === Number(req.params.id)
        );

        if (!task) {
            return sendError(
                res,
                404,
                "NOT_FOUND",
                "Task not found"
            );
        }

        sendSuccess(res, task);

    } catch (error) {
        next(error);
    }
});

// =====================
// CREATE TASK
// =====================

app.post("/tasks", async (req, res, next) => {

    if (typeof req.body.title !== "string") {
        return sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "title must be a string"
        );
    }

    if (req.body.title.trim() === "") {
        return sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "title is required"
        );
    }

    if (
        req.body.done !== undefined &&
        typeof req.body.done !== "boolean"
    ) {
        return sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "done must be a boolean"
        );
    }

    try {

        const tasks = await loadTasks();

        const newTask = {
            id: Date.now(),
            title: req.body.title.trim(),
            done: req.body.done ?? false
        };

        tasks.push(newTask);

        await saveTasks(tasks);

        sendSuccess(res, newTask, 201);

    } catch (error) {
        next(error);
    }
});

// =====================
// UPDATE TASK
// =====================

app.patch("/tasks/:id", async (req, res, next) => {

    if (
        req.body.title !== undefined &&
        typeof req.body.title !== "string"
    ) {
        return sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "title must be a string"
        );
    }

    if (
        req.body.title !== undefined &&
        req.body.title.trim() === ""
    ) {
        return sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "title cannot be empty"
        );
    }

    if (
        req.body.done !== undefined &&
        typeof req.body.done !== "boolean"
    ) {
        return sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "done must be a boolean"
        );
    }

    try {

        const tasks = await loadTasks();

        const task = tasks.find(
            task => task.id === Number(req.params.id)
        );

        if (!task) {
            return sendError(
                res,
                404,
                "NOT_FOUND",
                "Task not found"
            );
        }

        if (req.body.title !== undefined) {
            task.title = req.body.title.trim();
        }

        if (req.body.done !== undefined) {
            task.done = req.body.done;
        }

        await saveTasks(tasks);

        sendSuccess(res, task);

    } catch (error) {
        next(error);
    }
});

// =====================
// DELETE TASK
// =====================

app.delete("/tasks/:id", async (req, res, next) => {
    try {

        const tasks = await loadTasks();

        const task = tasks.find(
            task => task.id === Number(req.params.id)
        );

        if (!task) {
            return sendError(
                res,
                404,
                "NOT_FOUND",
                "Task not found"
            );
        }

        const updatedTasks = tasks.filter(
            task => task.id !== Number(req.params.id)
        );

        await saveTasks(updatedTasks);

        res.status(204).send();

    } catch (error) {
        next(error);
    }
});

// =====================
// ROUTE NOT FOUND
// =====================

app.use((req, res) => {
    sendError(
        res,
        404,
        "ROUTE_NOT_FOUND",
        "Route not found"
    );
});

// =====================
// CENTRAL ERROR HANDLER
// =====================

app.use((error, req, res, next) => {

    res.status(error.status ?? 500).json({
        success: false,
        error: {
            code: error.code ?? "SERVER_ERROR",
            message: error.message
        }
    });

});

// =====================
// SERVER
// =====================

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});