import express from "express";
import { readFile, writeFile } from "node:fs";

const app = express();
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function sendSuccess(res, data, status = 200) {
    res.status(status).json({
        success: true,
        data
    });
}

function sendError(res, status, code, message) {
    res.status(status).json({
        success: false,
        error: {
            code,
            message
        }
    });
}

function loadTasks(callback) {
    readFile("tasks.json", "utf-8", (err, data) => {

        if (err) {
            return callback(null, []);
        }

        try {
            const tasks = JSON.parse(data);
            callback(null, tasks);
        } catch {
            callback("stored data is corrupt");
        }
    });
}

function saveTasks(tasks, callback) {
    writeFile(
        "tasks.json",
        JSON.stringify(tasks, null, 2),
        callback
    );
}

app.get("/tasks", (req, res) => {

    loadTasks((error, tasks) => {

        if (error) {
            return sendError(
                res,
                500,
                "CORRUPT_DATA",
                error
            );
        }

        sendSuccess(res, tasks);
    });

});

app.get("/tasks/:id", (req, res) => {

    loadTasks((error, tasks) => {

        if (error) {
            return sendError(
                res,
                500,
                "CORRUPT_DATA",
                error
            );
        }

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

    });

});

app.post("/tasks", (req, res) => {

    if (!req.body?.title) {
        return sendError(
            res,
            400,
            "VALIDATION_ERROR",
            "title is required"
        );
    }

    loadTasks((error, tasks) => {

        if (error) {
            return sendError(
                res,
                500,
                "CORRUPT_DATA",
                error
            );
        }

        const newTask = {
            id: Date.now(),
            title: req.body.title,
            done: req.body.done ?? false
        };

        tasks.push(newTask);

        saveTasks(tasks, (err) => {

            if (err) {
                return sendError(
                    res,
                    500,
                    "WRITE_ERROR",
                    "Unable to save task"
                );
            }

            sendSuccess(res, newTask, 201);

        });

    });

});

app.patch("/tasks/:id", (req, res) => {

    loadTasks((error, tasks) => {

        if (error) {
            return sendError(
                res,
                500,
                "CORRUPT_DATA",
                error
            );
        }

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
            task.title = req.body.title;
        }

        if (req.body.done !== undefined) {
            task.done = req.body.done;
        }

        saveTasks(tasks, (err) => {

            if (err) {
                return sendError(
                    res,
                    500,
                    "WRITE_ERROR",
                    "Unable to update task"
                );
            }

            sendSuccess(res, task);

        });

    });

});

app.delete("/tasks/:id", (req, res) => {

    loadTasks((error, tasks) => {

        if (error) {
            return sendError(
                res,
                500,
                "CORRUPT_DATA",
                error
            );
        }

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

        saveTasks(updatedTasks, (err) => {

            if (err) {
                return sendError(
                    res,
                    500,
                    "WRITE_ERROR",
                    "Unable to delete task"
                );
            }

            res.status(204).send();

        });

    });

});

app.listen(port, () => {
    console.log(`Running on port ${port}`);
});