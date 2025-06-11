pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_DIR = "/home/ubuntu/learningapp"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // This will automatically check out the `dev` branch when triggered via webhook
                git branch: 'dev', url: 'https://github.com/your-username/your-repo.git'
            }
        }

        stage('Rebuild and Restart Docker Compose') {
            steps {
                dir("${COMPOSE_PROJECT_DIR}") {
                    sh 'docker-compose down'
                    sh 'docker-compose up --build -d'
                }
            }
        }
    }
}
