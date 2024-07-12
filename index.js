const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const messagesFilePath = path.join(__dirname, 'data', 'messages.json');
const teachersFilePath = path.join(__dirname, 'data', 'teachers.json');

const readData = (filePath) => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  }
  return {};
};

const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

let messages = readData(messagesFilePath);
let teachers = readData(teachersFilePath);

const getTeacherData = (senderID) => {
  if (!teachers[senderID]) {
    teachers[senderID] = { name: `Teacher_${senderID}`, teaches: 0 };
  }
  return teachers[senderID];
};

app.get('/baby', (req, res) => {
  const { text, remove, list, edit, teach, reply, react, senderID, index } = req.query;

  if (text) {
    const messageReplies = messages[text.toLowerCase()] || [];
    const reply = messageReplies.length ? messageReplies[Math.floor(Math.random() * messageReplies.length)] : "I don't know what to say.";
    return res.json({ reply });
  }

  if (remove) {
    if (index) {
      const messageReplies = messages[remove.toLowerCase()];
      if (messageReplies && messageReplies[index]) {
        messageReplies.splice(index, 1);
        if (!messageReplies.length) delete messages[remove.toLowerCase()];
        writeData(messagesFilePath, messages);
        return res.json({ message: 'Reply removed successfully.' });
      }
      return res.json({ message: 'Reply not found.' });
    }
    delete messages[remove.toLowerCase()];
    writeData(messagesFilePath, messages);
    return res.json({ message: 'Message removed successfully.' });
  }

  if (list === 'all') {
    return res.json({ messages });
  }

  if (edit && reply) {
    const messageReplies = messages[edit.toLowerCase()];
    if (messageReplies) {
      messageReplies[0] = reply;
      writeData(messagesFilePath, messages);
      return res.json({ message: 'Reply edited successfully.' });
    }
    return res.json({ message: 'Message not found.' });
  }

  if (teach && reply) {
    const messageReplies = messages[teach.toLowerCase()] || [];
    messageReplies.push(...reply.split(',').map(r => r.trim()));
    messages[teach.toLowerCase()] = messageReplies;
    writeData(messagesFilePath, messages);
    const teacherData = getTeacherData(senderID);
    teacherData.teaches += 1;
    writeData(teachersFilePath, teachers);
    return res.json({ message: 'Replies added successfully.', teacher: teacherData.name, teachs: teacherData.teaches });
  }

  if (teach && react) {
    const messageReplies = messages[teach.toLowerCase()] || [];
    messageReplies.push(...react.split(',').map(r => r.trim()));
    messages[teach.toLowerCase()] = messageReplies;
    writeData(messagesFilePath, messages);
    const teacherData = getTeacherData(senderID);
    teacherData.teaches += 1;
    writeData(teachersFilePath, teachers);
    return res.json({ message: 'Reactions added successfully.', teacher: teacherData.name, teachs: teacherData.teaches });
  }

  return res.status(400).json({ message: 'Invalid request.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
