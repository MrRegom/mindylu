#!/bin/bash
TARGET="/var/www/mindylu"
GIT_DIR="/var/repo/mindylu.git"
BRANCH="master"

while read oldrev newrev ref
do
    # Only deploy master branch
    if [[ $ref = refs/heads/$BRANCH ]]; then
        echo "Ref $ref received. Deploying ${BRANCH} branch to production..."
        
        # Checkout code
        mkdir -p $TARGET
        git --work-tree=$TARGET --git-dir=$GIT_DIR checkout -f $BRANCH

        # Backend setup
        echo "Setting up Backend..."
        cd $TARGET/backend
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        python manage.py migrate
        python manage.py collectstatic --noinput
        
        # Auto-seed: Garantizar datos iniciales si la BD está vacía
        echo "Verificando datos iniciales (seed)..."
        # python full_seed.py 2>&1 | tail -5

        # Restart Gunicorn if it exists
        if systemctl list-unit-files | grep -q gunicorn.service; then
            echo "Restarting Gunicorn..."
            systemctl restart gunicorn
        fi

        # Frontend setup
        echo "Setting up Frontend..."
        cd $TARGET/frontend
        npm install
        npm run build

        echo "Deployment completed successfully!"
    else
        echo "Ref $ref received. Doing nothing: only the ${BRANCH} branch may be deployed on this server."
    fi
done
