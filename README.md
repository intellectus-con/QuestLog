# Quest Log

A web application for tracking tasks and goals in a video game quest log.

## Features

- **Multiple Quest Logs**: Create and manage multiple quest logs for different areas of your life
- **Quest Management**: Add quests with descriptions and objectives
- **Objective Tracking**: Mark objectives as complete by clicking on them
- **File-Based Storage**: All data is saved to files on your computer
- **Import/Export**: Share quest logs with others or back them up
- **Premade Templates**: Start with pre-configured quest logs for common use cases
- **Modern UI**: Clean, responsive design with light/dark mode support

## Running Locally

### Prerequisites

- Python 3.6 or higher

### Setup and Run

1. Download all files to a folder on your computer
2. Open a terminal or command prompt
3. Navigate to the folder containing the files
4. Run the server:

\`\`\`bash
python server.py
\`\`\`

5. Open your web browser and go to: `http://localhost:8000`

The server will continue running until you stop it (Ctrl+C in the terminal). All your quest logs will be saved in the `data/logs` folder.

## Using the Application

### Main Screen

- **Create New Quest Log**: Start a new quest log from scratch
- **Import Quest Log**: Import a previously exported quest log (.quest file)
- **Browse Templates**: Choose from premade quest log templates

### Quest Log View

- **Left Side**: List of quests in the current log
- **Right Side**: Details of the selected quest
- **Add Quest**: Create a new quest with a title, description, and objectives
- **Export**: Save your quest log as a .quest file for backup or sharing
- **Delete**: Remove the current quest log

### Quest Details

- Click on an objective to mark it as complete/incomplete
- Each quest shows progress (completed/total objectives)

## Data Storage

All data is stored in files on your computer:

- Quest logs are saved in the `data/logs` folder
- Templates are stored in the `data/templates` folder

This means:
- Your data persists even when you restart your computer
- You can back up your data by copying these folders
- You can share quest logs by exporting them as .quest files`

## Customization

Feel free to customize the application by:

1. Modifying the CSS in `styles.css` to change the appearance
2. Adding new templates to the `data/templates` folder
3. Extending the server functionality in `server.py`

## Troubleshooting

- **Server won't start**: Make sure Python 3.6+ is installed and you're in the correct directory
- **Changes not saving**: Check that the `data` directory is writable
- **Import fails**: Ensure the file is a valid .quest file (JSON format)
