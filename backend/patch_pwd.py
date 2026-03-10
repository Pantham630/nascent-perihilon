from app import database, models, auth_utils
import sys

def patch():
    print("Starting password reset...")
    try:
        db = next(database.get_db())
        pwd = auth_utils.hash_password("Password123")
        print("Generated hash:", pwd)
        users = db.query(models.User).all()
        for u in users:
            u.hashed_password = pwd
        db.commit()
        print(f"Successfully updated {len(users)} users.")
    except Exception as e:
        print("Error:", e)
        sys.exit(1)

if __name__ == "__main__":
    patch()
