import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const Room = ({ username, room, socket }) => {
  const [roomUser, setRoomUser] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const boxDivRef = useRef(null);

  const getOldMessages = async () => {
    const res = await fetch(`${import.meta.env.VITE_SERVER}/chat/${room}`);
    if(res.status === 403) {
      return navigate("/");
    } 
    const data = await res.json();
    setReceivedMessages((prevMessage) => [...prevMessage, ...data])
  }

  useEffect(() => {
    getOldMessages();
  }, [])

  useEffect(() => {
    // send joined user info
    socket.emit("joined_room", { username, room });

    // get welcome message
    socket.on("message", (data) => {
      setReceivedMessages((prevMsg) => [...prevMsg, data]);
    });

    // get room users
    socket.on("room_users", (data) => {
      let prevRoomUsers = [...roomUser];
      data.forEach((user) => {
        const index = prevRoomUsers.findIndex(
          (prevUser) => prevUser.id === user.id
        );
        if (index !== -1) {
          // Merge same user
          prevRoomUsers[index] = { ...prevRoomUsers[index], ...user };
        } else {
          prevRoomUsers.push(user);
        }
      });
      // setRoomUser(() => [...data]);
      setRoomUser(prevRoomUsers); 
    });

    return () => {
      console.log("Unmount successfully");
      socket.disconnect();
    };
  }, [socket]);

  const sendMessage = () => {
    if (message.trim().length > 0) {
      socket.emit("send_message", message);
      setMessage(" ");
    }
  };

  const leaveRoom = () => {
    navigate("/");
  };

  useEffect(() => {
    if(boxDivRef.current) {
      boxDivRef.current.scrollTop = boxDivRef.current.scrollHeight;
    }
  }, [receivedMessages])

  return (
    <section className="flex gap-4">
      <div className="w-1/3 bg-blue-600 h-screen text-white font-medium relative">
        <p className="text-3xl font-bold text-center mt-5">Room.io</p>
        <div className="mt-10 ps-2">
          <p className="text-lg flex items-end gap-1">
            <ChatBubbleLeftRightIcon width={30} height={30} />
            Room Name
          </p>
          <p className="bg-white text-blue-600 ps-5 py-2 rounded-tl-full rounded-bl-full">
            {room}
          </p>
        </div>
        <div className="mt-5 ps-2">
          <p className="flex items-center gap-2 text-lg mb-3">
            <UserGroupIcon width={30} height={30} />
            Users
          </p>
          {roomUser.map((user, i) => (
            <p key={i} className="flex items-end gap-2 text-sm my-2">
              <UserIcon width={26} height={26} />
              {user.username === username ? "You" : user.username}
            </p>
          ))}
        </div>
        <button
          type="button"
          className="absolute bottom-0 p-2.5 flex items-center gap-1 w-full mx-2 mb-2 text-lg"
          onClick={leaveRoom}
        >
          <ArrowRightOnRectangleIcon width={30} height={30} />
          Leave Room
        </button>
      </div>
      <div className="w-full pt-5 relative">
        <div className="h-[30rem] overflow-y-auto" ref={boxDivRef}>
          {receivedMessages.map((msg, i) => {
            return (
              <div
                key={i}
                className="text-white bg-blue-600 px-3 py-2 m-3 w-3/4 rounded-[20px] rounded-bl-none"
              >
                <p className="text-sm font-medium font-mono">
                  From {msg.username}
                </p>
                <p className="text-lg font-medium">{msg.message}</p>
                <p className="text-sm font-mono font-medium text-right">
                  {formatDistanceToNow(new Date(msg.sent_at))}
                </p>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-0 my-2 py-2.5 flex items-end w-full px-2">
          <input
            type="text"
            placeholder="Message..."
            className="w-full outline-none border-b border-b-blue-600 text-lg me-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="button" className="hover:-rotate-45 duration-200">
            <PaperAirplaneIcon
              width={30}
              height={30}
              className="text-blue-600"
              onClick={sendMessage}
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Room;
