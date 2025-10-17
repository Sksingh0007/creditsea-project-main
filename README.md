# CreditSea

CreditSea is a fullstack MERN application to process and manage Experian XML credit reports.

This README covers local setup, environment variables, how to run the app, API endpoints, testing, and troubleshooting notes.

---

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (local or Atlas)
- Git

---

## Quick start (development)

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd creditsea-project
```

2. Backend

```bash
cd backend
npm install
# Create or edit backend/.env as needed (example below)
npm run dev
# Backend runs on the PORT in backend/.env (this repo uses 5001 by default)
```

3. Frontend

```bash
cd frontend
npm install
npm run dev
# Vite dev server typically runs on http://localhost:5173
```

Note: The frontend uses `frontend/.env` with `VITE_API_BASE_URL` to point at the backend (e.g. `http://localhost:5001`).

---

## Environment example

backend/.env

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/creditsea
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

frontend/.env

```env
VITE_API_BASE_URL=http://localhost:5001
```

---

## API (local development)

Base URL: `http://localhost:5001/api`

- POST `/api/upload` — multipart/form-data with field `xmlFile` (XML file)
- GET `/api/reports` — list reports
- GET `/api/reports/:id` — single report
- DELETE `/api/reports/:id` — delete report
- GET `/api/health` — health check

Example curl (health):

```bash
curl http://localhost:5001/api/health
```

Upload example:

```bash
curl -X POST http://localhost:5001/api/upload \
  -F "xmlFile=@sample-credit-report.xml"
```

---

## Tests

### Backend

```bash
cd backend
npm install
npm test
```

### Frontend

The frontend tests use Jest. From the frontend folder run:

```bash
cd frontend
npm install
npx jest --config jest.config.cjs --color --runInBand
```

Notes:

- If tests complain about `import.meta` or Babel config, ensure tests import environment values from `process.env` (setupTests.js sets VITE_API_BASE_URL for tests).
- Use the repository's `jest.config.cjs` and `babel.config.js` (CommonJS) when running tests locally.

---

## Troubleshooting

- CORS / port conflicts: On macOS the system may bind to port 5000 (AirPlay), causing requests to hit that service instead of your backend and produce CORS errors. If you see "No 'Access-Control-Allow-Origin' header is present", verify:

  - Backend is running on the port referenced by `frontend/.env`.
  - The correct port is free (consider using 5001 as in this repo).

- Jest errors about Babel / testEnvironmentOptions: make sure `jest` and `jest-environment-jsdom` versions are compatible and that you run Jest with the provided CommonJS config (`jest.config.cjs`).

---

## Project layout (high level)

```
creditsea-project/
├─ backend/        # Express API, routes, models, uploads
├─ frontend/       # React + Vite app
└─ README.md
```

---

If you'd like, I can:

- Add a small troubleshooting section showing how to `git rm --cached` tracked files to remove files now ignored by .gitignore.
- Update frontend pages to read env via a small `src/config.js` so tests avoid `import.meta` parsing issues.

Tell me which of those you'd like me to do next.

### Reports List

![Reports List](assects/reports-list.png)

### Report Detail

![Report Detail](screenshots/report-detail.png)

---

## 🎥 Demo Video

[Watch Demo Video](https://youtu.be/your-demo-video-link)

**Video Contents:**

- Project overview (30 seconds)
- File upload demonstration (1 minute)
- Report viewing and navigation (1.5 minutes)
- API testing (1 minute)
- Code walkthrough (1 minute)

---

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**

```
Solution: Ensure MongoDB is running
- Mac: brew services start mongodb-community
- Windows: Check MongoDB service in Services
- Linux: sudo systemctl start mongod
```

**2. Port Already in Use**

```
Solution: Change PORT in .env or kill existing process
- Find: lsof -i :5000
- Kill: kill -9 <PID>
```

**3. CORS Error**

```
Solution: Ensure backend CORS is configured properly
Check backend server.js has: app.use(cors())
```

**4. File Upload Fails**

```
Solution: Check file size limit and format
- Max size: 10MB
- Format: .xml only
```

---

## 📝 Development Notes

### XML Parsing Strategy

The parser handles various Experian XML formats by:

- Flexible path navigation
- Null-safe data extraction
- Fallback values for missing fields
- Support for nested structures

### Security Considerations

- File type validation
- File size limits (10MB)
- Input sanitization
- Error message sanitization
- No sensitive data in logs

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Experian for credit report format reference
- MongoDB for excellent database documentation
- React community for amazing components
- CreditSea team for the opportunity

---

## 📞 Support

For issues or questions:

- Create an issue on GitHub
- Email: support@creditsea.com
- Documentation: [Wiki](https://github.com/yourusername/creditsea/wiki)

---

**Made with ❤️ for CreditSea Assignment**
