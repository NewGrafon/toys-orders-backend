export enum ExceptionMessages {
  SomethingWrong = 'Что-то произошло не так. Попробуйте перезагрузить страницу.',
  Unauthorized = 'Пользователь не авторизован.',
  Authorized = 'Пользователь уже авторизован!',
  UserNotFound = 'Пользователь не найден.',
  OrderNotFound = 'Заказ не найден.',
  OrderAlreadyTaken = 'Заказ уже взят другим пользователем.',
}

export enum ResultMessages {
  LoginSuccessful = 'Авторизация произошла успешно!',
  LoginReject = 'Не получилось авторизоваться. Проверьте введеные данные.',
}
