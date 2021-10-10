import { useEffect, useState } from "react";
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import Main from "./Main";
import ImagePopup from "./ImagePopup";
import AddPlacePopup from "./AddPlacePopup";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import api from "../utils/api";
import Login from "./Login";
import Register from "./Register";
import InfoToolTip from "./InfoTooltip";
import * as mestoAuth from "../utils/mestoAuth";
import ProtectedRoute from "./ProtectedRoute";
import { Route, Switch, useHistory } from "react-router-dom";

import CurrentUserContext from "../context/CurrentUserContext";

const App =() => {
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] =
    React.useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
  const [isEditAvatarPopupOpen, setEditAvatarPopupOpen] = React.useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState("");

  const [isInfoToolTipOpened, setIsInfoToolTipOpened] = useState(false);
  const [isSuccseed, setSuccseed] = useState(true);

  const history = useHistory();

  const onRegister = ({ email, password }) => {
    console.log(email);
    return mestoAuth
      .register(email, password)
      .then(() => {
        setSuccseed(true);
      })
      .catch(() => {
        setSuccseed(false);
      })
      .finally(setIsInfoToolTipOpened(true));
  };

  const onLogin = ({ email, password }) => {
    return mestoAuth
      .authorize(email, password)
      .then((data) => {
        localStorage.setItem("token", data.token);
        setLoggedIn(true);
        setUserData(email);
        history.push("/");
      })
      .catch(() => {
        setSuccseed(false);
        setIsInfoToolTipOpened(true);
        setLoggedIn(false);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      mestoAuth
        .getContent(token)
        .then((data) => {
          if (data) {
            setLoggedIn(true);
            setUserData(data.data.email);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, []);

  useEffect(() => {
    if (loggedIn) history.push("/");
  }, [history, loggedIn]);

  const onSignOut = () => {
    localStorage.removeItem("token");
    history.push("/sign-in");
  }

  //изменение стейта при открытии попапап
  const onEditProfile = () => {
    setIsEditProfilePopupOpen(true);
  };
  const onEditAvatar = () => {
    setEditAvatarPopupOpen(true);
  };
  const onAddPlace = () => {
    setIsAddPlacePopupOpen(true);
  };
  const onCardClick = (cards) => setSelectedCard(cards);

  const [currentUser, setCurrentUser] = useState({});

  useEffect(() => {
    api
      .getUserInfo()
      .then((currentUser) => {
        setCurrentUser(currentUser);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleUpdateUser = ({ name, about }) => {
    api
      .setUserInfo(name, about)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleUpdateAvatar = ({ avatar }) => {
    api
      .setAvatar(avatar)
      .then((avatarData) => {
        setCurrentUser(avatarData);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleAddCard = ({ name, link }) => {
    api
      .addNewCard(name, link)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const [cards, setCards] = React.useState([]);
  const [selectedCard, setSelectedCard] = React.useState(null);

  useEffect(() => {
    api
      .getServerCards()
      .then((cards) => {
        setCards(cards);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleCardLike = (card) => {
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    api
      .likeCard(card._id, isLiked)
      .then((newCard) => {
        setCards((state) =>
          state.map((c) => (c._id === card._id ? newCard : c))
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCardDelete = (card) => {
    api
      .deleteCardRequest(card._id)
      .then((data) => {
        setCards((state) => state.filter((j) => j._id !== card._id && data));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const closeAllPopups = () => {
    setIsEditProfilePopupOpen(false);
    setEditAvatarPopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsInfoToolTipOpened(false);
    setSelectedCard(null);
  };

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="root">
        <Header email={userData} onSignOut={onSignOut} />
        <Switch>
          <ProtectedRoute
            exact
            path="/"
            loggedIn={loggedIn}
            cards={cards}
            userInfo={currentUser}
            onCardDelete={handleCardDelete}
            onCardLike={handleCardLike}
            onCardClick={onCardClick}
            handleEditAvatarClick={onEditAvatar}
            handleEditProfileClick={onEditProfile}
            handleAddPlaceClick={onAddPlace}
            component={Main}
          ></ProtectedRoute>

          <Route path="/sign-in">
            <Login onLogin={onLogin} />
          </Route>

          <Route path="/sign-up">
            <Register onRegister={onRegister} />
          </Route>
        </Switch>

        <Footer />

        <InfoToolTip
          id="reg-pic"
          isOpened={isInfoToolTipOpened}
          onClose={closeAllPopups}
          isSuccseed={isSuccseed}
        />

        <ImagePopup id={"image"} card={selectedCard} onClose={closeAllPopups} />

        <EditProfilePopup
          isOpened={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />

        <EditAvatarPopup
          isOpened={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />

        <AddPlacePopup
          isOpened={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddCard={handleAddCard}
        />
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;
