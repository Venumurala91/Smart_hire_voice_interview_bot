# full-path: /database.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Interview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    candidate_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    job_position = db.Column(db.String(150), nullable=False)
    job_description = db.Column(db.Text, nullable=False)
    skills_to_assess = db.Column(db.Text, nullable=True)
    
    # NEW: Store the filename of the uploaded resume
    resume_filename = db.Column(db.String(255), nullable=True)

    status = db.Column(db.String(30), default='pending', nullable=False)
    transcript = db.Column(db.Text, nullable=True)
    duration_in_seconds = db.Column(db.Integer, nullable=True)
    recording_url = db.Column(db.String(500), nullable=True)
    assessment = db.Column(db.Text, nullable=True)
    score = db.Column(db.Integer, nullable=True)
    recommendation = db.Column(db.String(50), nullable=True)
    
    # Detailed Analysis Fields
    comm_score = db.Column(db.Integer, nullable=True)
    tech_score = db.Column(db.Integer, nullable=True)
    relevance_score = db.Column(db.Integer, nullable=True)
    
    # Timestamp for tracking stuck calls
    last_status_change = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class JobDescription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'description': self.description}

class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'message': self.message, 'timestamp': self.timestamp.isoformat()}