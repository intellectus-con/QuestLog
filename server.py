#!/usr/bin/env python3
"""
Quest Log Server
A simple HTTP server that handles file operations for the Quest Log web app.
"""

import os
import json
import shutil
import http.server
import socketserver
import urllib.parse
from http import HTTPStatus
from datetime import datetime
from pathlib import Path

# Configuration
PORT = 8000
DATA_DIR = "data"
LOGS_DIR = os.path.join(DATA_DIR, "logs")
TEMPLATES_DIR = os.path.join(DATA_DIR, "templates")
PUBLIC_DIR = "."  # Current directory for static files

# Ensure directories exist
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# Sample templates
SAMPLE_TEMPLATES = [
    {
        "id": "daily-tasks",
        "name": "Daily Tasks",
        "description": "A template for tracking daily tasks and routines",
        "quests": [
            {
                "id": "morning-routine",
                "title": "Morning Routine",
                "description": "Complete your morning routine to start the day right",
                "objectives": [
                    {"id": "obj1", "title": "Wake up at 6:30 AM", "completed": False},
                    {"id": "obj2", "title": "Drink water", "completed": False},
                    {"id": "obj3", "title": "Exercise for 15 minutes", "completed": False},
                    {"id": "obj4", "title": "Eat breakfast", "completed": False},
                    {"id": "obj5", "title": "Plan your day", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "work-tasks",
                "title": "Work Tasks",
                "description": "Complete your work tasks for the day",
                "objectives": [
                    {"id": "obj1", "title": "Check emails", "completed": False},
                    {"id": "obj2", "title": "Attend daily meeting", "completed": False},
                    {"id": "obj3", "title": "Complete primary task", "completed": False},
                    {"id": "obj4", "title": "Follow up with team", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "evening-routine",
                "title": "Evening Routine",
                "description": "Wind down and prepare for tomorrow",
                "objectives": [
                    {"id": "obj1", "title": "Review today's accomplishments", "completed": False},
                    {"id": "obj2", "title": "Prepare for tomorrow", "completed": False},
                    {"id": "obj3", "title": "Read for 30 minutes", "completed": False},
                    {"id": "obj4", "title": "Sleep by 10:30 PM", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            }
        ],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    },
    {
        "id": "fitness-journey",
        "name": "Fitness Journey",
        "description": "Track your fitness goals and progress",
        "quests": [
            {
                "id": "strength-training",
                "title": "Strength Training",
                "description": "Build strength through regular weight training",
                "objectives": [
                    {"id": "obj1", "title": "Upper body workout (2x per week)", "completed": False},
                    {"id": "obj2", "title": "Lower body workout (2x per week)", "completed": False},
                    {"id": "obj3", "title": "Increase bench press by 10%", "completed": False},
                    {"id": "obj4", "title": "Master proper squat form", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "cardio-endurance",
                "title": "Cardio & Endurance",
                "description": "Improve cardiovascular health and endurance",
                "objectives": [
                    {"id": "obj1", "title": "Run 5k without stopping", "completed": False},
                    {"id": "obj2", "title": "30 minutes of cardio (3x per week)", "completed": False},
                    {"id": "obj3", "title": "Try a new cardio activity", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "nutrition",
                "title": "Nutrition",
                "description": "Maintain a balanced diet to fuel your fitness journey",
                "objectives": [
                    {"id": "obj1", "title": "Track macros for 2 weeks", "completed": False},
                    {"id": "obj2", "title": "Meal prep weekly", "completed": False},
                    {"id": "obj3", "title": "Drink 2L of water daily", "completed": False},
                    {"id": "obj4", "title": "Reduce processed food intake", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            }
        ],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    },
    {
        "id": "project-management",
        "name": "Project Management",
        "description": "Organize and track your work projects",
        "quests": [
            {
                "id": "project-planning",
                "title": "Project Planning",
                "description": "Set up the foundation for your project",
                "objectives": [
                    {"id": "obj1", "title": "Define project scope", "completed": False},
                    {"id": "obj2", "title": "Create timeline", "completed": False},
                    {"id": "obj3", "title": "Assign responsibilities", "completed": False},
                    {"id": "obj4", "title": "Set up tracking system", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "execution-phase",
                "title": "Execution Phase",
                "description": "Implement the project plan",
                "objectives": [
                    {"id": "obj1", "title": "Complete first milestone", "completed": False},
                    {"id": "obj2", "title": "Weekly progress reviews", "completed": False},
                    {"id": "obj3", "title": "Address blockers", "completed": False},
                    {"id": "obj4", "title": "Update stakeholders", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            }
        ],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    },
    {
        "id": "algebra-2",
        "name": "10th Grade Algebra II",
        "description": "A comprehensive curriculum for 10th grade Algebra II",
        "quests": [
            {
                "id": "linear-equations",
                "title": "Linear Equations and Inequalities",
                "description": "Master solving and graphing linear equations and inequalities in one and two variables.",
                "objectives": [
                    {"id": "obj1", "title": "Solve linear equations with variables on both sides", "completed": False},
                    {"id": "obj2", "title": "Graph linear equations using slope-intercept form", "completed": False},
                    {"id": "obj3", "title": "Solve systems of linear equations", "completed": False},
                    {"id": "obj4", "title": "Solve and graph linear inequalities", "completed": False},
                    {"id": "obj5", "title": "Complete linear word problems", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "quadratic-functions",
                "title": "Quadratic Functions",
                "description": "Understand and work with quadratic functions and their applications.",
                "objectives": [
                    {"id": "obj1", "title": "Graph quadratic functions", "completed": False},
                    {"id": "obj2", "title": "Find zeros using factoring", "completed": False},
                    {"id": "obj3", "title": "Apply the quadratic formula", "completed": False},
                    {"id": "obj4", "title": "Complete the square", "completed": False},
                    {"id": "obj5", "title": "Solve quadratic word problems", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "polynomials",
                "title": "Polynomials and Rational Expressions",
                "description": "Learn to manipulate and solve polynomial and rational expressions.",
                "objectives": [
                    {"id": "obj1", "title": "Add, subtract, and multiply polynomials", "completed": False},
                    {"id": "obj2", "title": "Factor polynomials", "completed": False},
                    {"id": "obj3", "title": "Simplify rational expressions", "completed": False},
                    {"id": "obj4", "title": "Solve polynomial equations", "completed": False},
                    {"id": "obj5", "title": "Graph polynomial functions", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "exponential-logarithmic",
                "title": "Exponential and Logarithmic Functions",
                "description": "Explore exponential growth/decay and logarithmic relationships.",
                "objectives": [
                    {"id": "obj1", "title": "Evaluate exponential expressions", "completed": False},
                    {"id": "obj2", "title": "Graph exponential functions", "completed": False},
                    {"id": "obj3", "title": "Convert between exponential and logarithmic forms", "completed": False},
                    {"id": "obj4", "title": "Solve logarithmic equations", "completed": False},
                    {"id": "obj5", "title": "Apply exponential models to real-world scenarios", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            }
        ],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    },
    {
        "id": "geometry",
        "name": "High School Geometry",
        "description": "A structured curriculum for high school geometry",
        "quests": [
            {
                "id": "basic-concepts",
                "title": "Basic Geometric Concepts",
                "description": "Learn the fundamental concepts and vocabulary of geometry.",
                "objectives": [
                    {"id": "obj1", "title": "Identify points, lines, planes, and angles", "completed": False},
                    {"id": "obj2", "title": "Measure and classify angles", "completed": False},
                    {"id": "obj3", "title": "Understand parallel and perpendicular lines", "completed": False},
                    {"id": "obj4", "title": "Apply the coordinate system", "completed": False},
                    {"id": "obj5", "title": "Use geometric notation correctly", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "triangles",
                "title": "Triangles and Congruence",
                "description": "Explore properties of triangles and methods to prove congruence.",
                "objectives": [
                    {"id": "obj1", "title": "Classify triangles by sides and angles", "completed": False},
                    {"id": "obj2", "title": "Apply the triangle sum theorem", "completed": False},
                    {"id": "obj3", "title": "Prove triangles congruent using SSS, SAS, ASA, and AAS", "completed": False},
                    {"id": "obj4", "title": "Use triangle congruence to solve problems", "completed": False},
                    {"id": "obj5", "title": "Understand and apply the Pythagorean theorem", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "similarity",
                "title": "Similarity and Proportions",
                "description": "Understand similar figures and proportional relationships.",
                "objectives": [
                    {"id": "obj1", "title": "Identify similar triangles", "completed": False},
                    {"id": "obj2", "title": "Apply the AA similarity criterion", "completed": False},
                    {"id": "obj3", "title": "Use proportions to find missing measurements", "completed": False},
                    {"id": "obj4", "title": "Apply similarity to real-world problems", "completed": False},
                    {"id": "obj5", "title": "Understand scale factors and their effects", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "circles",
                "title": "Circles and Their Properties",
                "description": "Explore the properties and theorems related to circles.",
                "objectives": [
                    {"id": "obj1", "title": "Identify parts of a circle (radius, diameter, chord, arc)", "completed": False},
                    {"id": "obj2", "title": "Apply the inscribed angle theorem", "completed": False},
                    {"id": "obj3", "title": "Find arc lengths and sector areas", "completed": False},
                    {"id": "obj4", "title": "Write the equation of a circle", "completed": False},
                    {"id": "obj5", "title": "Solve problems involving tangent lines", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "area-volume",
                "title": "Area and Volume",
                "description": "Calculate measurements of two and three-dimensional figures.",
                "objectives": [
                    {"id": "obj1", "title": "Find areas of triangles, quadrilaterals, and circles", "completed": False},
                    {"id": "obj2", "title": "Calculate surface areas of 3D figures", "completed": False},
                    {"id": "obj3", "title": "Determine volumes of prisms, pyramids, cylinders, and spheres", "completed": False},
                    {"id": "obj4", "title": "Apply area and volume formulas to composite figures", "completed": False},
                    {"id": "obj5", "title": "Solve real-world measurement problems", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            }
        ],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    },
    {
        "id": "precalculus",
        "name": "11th Grade Pre-Calculus",
        "description": "A comprehensive curriculum for 11th grade Pre-Calculus",
        "quests": [
            {
                "id": "functions",
                "title": "Functions and Their Graphs",
                "description": "Analyze various functions and their graphical representations.",
                "objectives": [
                    {"id": "obj1", "title": "Identify function types and their characteristics", "completed": False},
                    {"id": "obj2", "title": "Find domains and ranges", "completed": False},
                    {"id": "obj3", "title": "Perform function transformations", "completed": False},
                    {"id": "obj4", "title": "Compose functions and find inverses", "completed": False},
                    {"id": "obj5", "title": "Analyze piecewise functions", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "trigonometry",
                "title": "Trigonometric Functions",
                "description": "Explore the properties and applications of trigonometric functions.",
                "objectives": [
                    {"id": "obj1", "title": "Convert between degrees and radians", "completed": False},
                    {"id": "obj2", "title": "Evaluate the six trigonometric functions", "completed": False},
                    {"id": "obj3", "title": "Graph sine, cosine, and tangent functions", "completed": False},
                    {"id": "obj4", "title": "Apply trigonometric identities", "completed": False},
                    {"id": "obj5", "title": "Solve trigonometric equations", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "vectors",
                "title": "Vectors and Parametric Equations",
                "description": "Work with vectors and parametric representations in two and three dimensions.",
                "objectives": [
                    {"id": "obj1", "title": "Perform vector operations", "completed": False},
                    {"id": "obj2", "title": "Find dot and cross products", "completed": False},
                    {"id": "obj3", "title": "Write parametric equations", "completed": False},
                    {"id": "obj4", "title": "Convert between parametric and rectangular forms", "completed": False},
                    {"id": "obj5", "title": "Apply vectors to physics problems", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "conic-sections",
                "title": "Conic Sections",
                "description": "Study the properties and equations of circles, ellipses, parabolas, and hyperbolas.",
                "objectives": [
                    {"id": "obj1", "title": "Identify and graph circles", "completed": False},
                    {"id": "obj2", "title": "Analyze ellipses and their properties", "completed": False},
                    {"id": "obj3", "title": "Work with parabolas in various forms", "completed": False},
                    {"id": "obj4", "title": "Understand hyperbolas and their asymptotes", "completed": False},
                    {"id": "obj5", "title": "Convert between general and standard forms", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            },
            {
                "id": "limits-intro",
                "title": "Introduction to Limits",
                "description": "Begin exploring the foundational concept of calculus: limits.",
                "objectives": [
                    {"id": "obj1", "title": "Evaluate limits graphically", "completed": False},
                    {"id": "obj2", "title": "Find limits algebraically", "completed": False},
                    {"id": "obj3", "title": "Understand one-sided limits", "completed": False},
                    {"id": "obj4", "title": "Identify when limits do not exist", "completed": False},
                    {"id": "obj5", "title": "Apply the squeeze theorem", "completed": False}
                ],
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            }
        ],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    }
]

class QuestLogHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler for the Quest Log server."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)
    
    def do_GET(self):
        """Handle GET requests."""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # API endpoints
        if path == '/api/logs':
            self.handle_get_logs()
        elif path.startswith('/api/log/'):
            log_id = path.split('/api/log/')[1]
            self.handle_get_log(log_id)
        elif path == '/api/templates':
            self.handle_get_templates()
        elif path.startswith('/api/import-template/'):
            template_id = path.split('/api/import-template/')[1]
            self.handle_import_template(template_id)
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests."""
        if self.path == '/api/save':
            self.handle_save_log()
        else:
            self.send_error(HTTPStatus.NOT_FOUND)
    
    def do_DELETE(self):
        """Handle DELETE requests."""
        if self.path.startswith('/api/delete/'):
            log_id = self.path.split('/api/delete/')[1]
            self.handle_delete_log(log_id)
        else:
            self.send_error(HTTPStatus.NOT_FOUND)
    
    def handle_get_logs(self):
        """Handle GET /api/logs - Return a list of all quest logs."""
        logs = []
        
        # Get all .quest files from the logs directory
        for filename in os.listdir(LOGS_DIR):
            if filename.endswith('.quest'):
                file_path = os.path.join(LOGS_DIR, filename)
                try:
                    with open(file_path, 'r') as f:
                        log = json.load(f)
                        # Include only basic info for the list
                        logs.append({
                            'id': log.get('id'),
                            'name': log.get('name'),
                            'quests': log.get('quests', []),
                            'created': log.get('created'),
                            'updated': log.get('updated')
                        })
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Error reading {filename}: {e}")
        
        self.send_json_response({'logs': logs})
    
    def handle_get_log(self, log_id):
        """Handle GET /api/log/:id - Return a specific quest log."""
        file_path = os.path.join(LOGS_DIR, f"{log_id}.quest")
        
        if not os.path.exists(file_path):
            self.send_error(HTTPStatus.NOT_FOUND, "Quest log not found")
            return
        
        try:
            with open(file_path, 'r') as f:
                log = json.load(f)
                self.send_json_response({'log': log})
        except (json.JSONDecodeError, IOError) as e:
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"Error reading quest log: {e}")
    
    def handle_save_log(self):
        """Handle POST /api/save - Save a quest log."""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(post_data)
            log = data.get('log')
            
            if not log or not log.get('id') or not log.get('name'):
                self.send_error(HTTPStatus.BAD_REQUEST, "Invalid quest log data")
                return
            
            # Save the log to a file
            file_path = os.path.join(LOGS_DIR, f"{log['id']}.quest")
            with open(file_path, 'w') as f:
                json.dump(log, f, indent=2)
            
            self.send_json_response({'success': True})
        except (json.JSONDecodeError, IOError) as e:
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"Error saving quest log: {e}")
    
    def handle_delete_log(self, log_id):
        """Handle DELETE /api/delete/:id - Delete a quest log."""
        file_path = os.path.join(LOGS_DIR, f"{log_id}.quest")
        
        if not os.path.exists(file_path):
            self.send_error(HTTPStatus.NOT_FOUND, "Quest log not found")
            return
        
        try:
            os.remove(file_path)
            self.send_json_response({'success': True})
        except IOError as e:
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"Error deleting quest log: {e}")
    
    def handle_get_templates(self):
        """Handle GET /api/templates - Return a list of available templates."""
        templates = []
        
        # First, check if we need to create sample templates
        if not os.listdir(TEMPLATES_DIR):
            self.create_sample_templates()
        
        # Get all template files
        for filename in os.listdir(TEMPLATES_DIR):
            if filename.endswith('.quest'):
                file_path = os.path.join(TEMPLATES_DIR, filename)
                try:
                    with open(file_path, 'r') as f:
                        template = json.load(f)
                        templates.append({
                            'id': template.get('id'),
                            'name': template.get('name'),
                            'description': template.get('description', '')
                        })
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Error reading template {filename}: {e}")
        
        self.send_json_response({'templates': templates})
    
    def handle_import_template(self, template_id):
        """Handle GET /api/import-template/:id - Import a template as a new quest log."""
        template_path = os.path.join(TEMPLATES_DIR, f"{template_id}.quest")
        
        if not os.path.exists(template_path):
            self.send_error(HTTPStatus.NOT_FOUND, "Template not found")
            return
        
        try:
            with open(template_path, 'r') as f:
                template = json.load(f)
            
            # Create a new quest log from the template
            new_log = template.copy()
            new_log['id'] = f"{int(datetime.now().timestamp())}"
            new_log['created'] = datetime.now().isoformat()
            new_log['updated'] = datetime.now().isoformat()
            
            # Save the new log
            log_path = os.path.join(LOGS_DIR, f"{new_log['id']}.quest")
            with open(log_path, 'w') as f:
                json.dump(new_log, f, indent=2)
            
            self.send_json_response({'success': True, 'log': new_log})
        except (json.JSONDecodeError, IOError) as e:
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, f"Error importing template: {e}")
    
    def create_sample_templates(self):
        """Create sample templates if none exist."""
        for template in SAMPLE_TEMPLATES:
            file_path = os.path.join(TEMPLATES_DIR, f"{template['id']}.quest")
            with open(file_path, 'w') as f:
                json.dump(template, f, indent=2)
    
    def send_json_response(self, data):
        """Send a JSON response."""
        self.send_response(HTTPStatus.OK)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))


def run_server():
    """Run the HTTP server."""
    with socketserver.TCPServer(("", PORT), QuestLogHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print(f"Data directory: {os.path.abspath(DATA_DIR)}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    # Create sample templates if they don't exist
    if not os.listdir(TEMPLATES_DIR):
        print("Creating sample templates...")
        for template in SAMPLE_TEMPLATES:
            file_path = os.path.join(TEMPLATES_DIR, f"{template['id']}.quest")
            with open(file_path, 'w') as f:
                json.dump(template, f, indent=2)
    
    run_server()
