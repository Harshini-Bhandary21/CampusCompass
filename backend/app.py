from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from tt import generate_timetable
import os
import uuid

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


@app.route("/schedule", methods=["POST"])
def schedule():
    file = request.files.get("file")
    if not file:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    # Save uploaded Excel with a unique name to avoid collisions
    run_id = uuid.uuid4().hex[:8]
    input_path = os.path.join(UPLOAD_FOLDER, f"input_{run_id}.xlsx")
    output_path = os.path.join(OUTPUT_FOLDER, f"timetable_{run_id}.xlsx")

    file.save(input_path)

    # generate_timetable() now runs the full iterative_repair pipeline
    result = generate_timetable(input_path, output_path=output_path)

    if not result["success"]:
        return jsonify(result), 500

    # Attach the run_id so the frontend can request the Excel download later
    result["run_id"] = run_id
    return jsonify(result)


@app.route("/download/<run_id>", methods=["GET"])
def download(run_id):
    """Return the generated Excel file for a given run."""
    # Sanitize: only hex chars allowed in run_id
    if not run_id.isalnum():
        return jsonify({"error": "Invalid run id"}), 400

    output_path = os.path.join(OUTPUT_FOLDER, f"timetable_{run_id}.xlsx")
    if not os.path.exists(output_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(
        output_path,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="generated_timetable.xlsx",
    )


if __name__ == "__main__":
    # threaded=False because OR-Tools CP-SAT uses its own thread pool
    app.run(port=5000, threaded=False)
