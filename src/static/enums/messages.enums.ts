export enum ExceptionMessages {
  SomethingWrong = 'Что-то произошло не так. Попробуйте перезагрузить страницу.',
  Unauthorized = 'Пользователь не авторизован.',
  Authorized = 'Пользователь уже авторизован!',
  UserNotFound = 'Пользователь не найден.',
  ToyExists = 'Деталь с данным кодом уже создана!',
  ToyNotFound = 'Деталь с данным кодом не найдена.',
  ToyAmountIncorrect = 'Неправильно указано количество для изменения товара в корзине!',
  CartTimeout = 'Попытка добавить новые элементы в заказ отклоняется, если заказ был сделан более 1 минуты назад!',
  OrderNotFound = 'Заказ не найден.',
  OrdersNotFound = 'Заказы не найдены.',
  IncorrectCloseOrdersDto = 'Incorrect CloseOrdersDto',
  OrderAlreadyTaken = 'Заказ уже взят другим пользователем.',
}

export enum ResultMessages {
  LoginSuccessful = 'Авторизация произошла успешно!',
  LoginReject = 'Не получилось авторизоваться. Проверьте введеные данные.',
}
