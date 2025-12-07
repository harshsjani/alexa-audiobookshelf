#!/bin/bash

# AudioBookshelf Alexa Skill - Setup Script
# This script helps set up the Python Flask application

set -e

echo "=================================="
echo "AudioBookshelf Alexa Skill Setup"
echo "=================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python 3.8 or higher is required. Found: $python_version"
    exit 1
fi
echo "✓ Python $python_version found"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists. Skipping..."
else
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip -q
echo "✓ pip upgraded"
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt -q
echo "✓ Dependencies installed"
echo ""

# Create .env file
if [ -f ".env" ]; then
    echo ".env file already exists. Skipping..."
else
    echo "Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your AudioBookshelf server details:"
    echo "   nano .env"
    echo ""
fi

# Test import
echo "Testing imports..."
python3 -c "import flask; from ask_sdk_core.skill_builder import SkillBuilder; print('✓ All imports successful')"
echo ""

echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your AudioBookshelf server details:"
echo "   nano .env"
echo ""
echo "2. Run the development server:"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "3. Test the endpoint:"
echo "   curl http://localhost:5000/health"
echo ""
echo "4. For production deployment, see DEPLOYMENT.md"
echo ""
echo "=================================="
