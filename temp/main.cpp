#include <iostream>
#include <vector>
#include <string>
using namespace std;

// Student class
class Student {
public:
    int id;
    string name;
    int age;
    float marks;

    // Constructor
    Student(int i, string n, int a, float m) {
        id = i;
        name = n;
        age = a;
        marks = m;
    }
};

// Vector to store students
vector<Student> students;

// Function declarations
void addStudent();
void displayStudents();
void searchStudent();
void updateStudent();
void deleteStudent();
void menu();

int main() {
    int choice;

    do {
        menu();
        cout << "\nEnter your choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                addStudent();
                break;
            case 2:
                displayStudents();
                break;
            case 3:
                searchStudent();
                break;
            case 4:
                updateStudent();
                break;
            case 5:
                deleteStudent();
                break;
            case 6:
                cout << "\nExiting program... Goodbye!\n";
                break;
            default:
                cout << "\nInvalid choice! Try again.\n";
        }
    } while (choice != 6);

    return 0;
}

// Menu function
void menu() {
    cout << "\n==============================";
    cout << "\n   STUDENT MANAGEMENT SYSTEM  ";
    cout << "\n==============================";
    cout << "\n1. Add Student";
    cout << "\n2. Display All Students";
    cout << "\n3. Search Student";
    cout << "\n4. Update Student";
    cout << "\n5. Delete Student";
    cout << "\n6. Exit";
    cout << "\n==============================\n";
}

// Add student
void addStudent() {
    int id, age;
    float marks;
    string name;

    cout << "\nEnter Student ID: ";
    cin >> id;
    cin.ignore();

    cout << "Enter Student Name: ";
    getline(cin, name);

    cout << "Enter Age: ";
    cin >> age;

    cout << "Enter Marks: ";
    cin >> marks;

    students.push_back(Student(id, name, age, marks));
    cout << "\nStudent added successfully!\n";
}

// Display students
void displayStudents() {
    if (students.empty()) {
        cout << "\nNo student records found.\n";
        return;
    }

    cout << "\n--- Student List ---\n";
    for (auto &s : students) {
        cout << "\nID: " << s.id;
        cout << "\nName: " << s.name;
        cout << "\nAge: " << s.age;
        cout << "\nMarks: " << s.marks;
        cout << "\n--------------------\n";
    }
}

// Search student
void searchStudent() {
    int id;
    cout << "\nEnter Student ID to search: ";
    cin >> id;

    for (auto &s : students) {
        if (s.id == id) {
            cout << "\nStudent Found!";
            cout << "\nName: " << s.name;
            cout << "\nAge: " << s.age;
            cout << "\nMarks: " << s.marks << endl;
            return;
        }
    }
    cout << "\nStudent not found!\n";
}

// Update student
void updateStudent() {
    int id;
    cout << "\nEnter Student ID to update: ";
    cin >> id;

    for (auto &s : students) {
        if (s.id == id) {
            cin.ignore();
            cout << "Enter New Name: ";
            getline(cin, s.name);

            cout << "Enter New Age: ";
            cin >> s.age;

            cout << "Enter New Marks: ";
            cin >> s.marks;

            cout << "\nStudent updated successfully!\n";
            return;
        }
    }
    cout << "\nStudent not found!\n";
}

// Delete student
void deleteStudent() {
    int id;
    cout << "\nEnter Student ID to delete: ";
    cin >> id;

    for (int i = 0; i < students.size(); i++) {
        if (students[i].id == id) {
            students.erase(students.begin() + i);
            cout << "\nStudent deleted successfully!\n";
            return;
        }
    }
    cout << "\nStudent not found!\n";
}
