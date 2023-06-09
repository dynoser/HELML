# HELMLobject

Это объектная реализация декодера HELML, отличающаяся от классической реализацией.

Классическая реализация это функция, которая получает на вход HELML, и возвращает структурирвованный объект со значениями.

Объектная реализация создаёт HELML-объект, который позволяет не просто декодировать, но и делать несколько "трюков".

Главное отличие объектной реализации состоит в том, что загрузка данных HELML и декодирование могут выполняться отдельно.

Можно по-разному декодировать уже загруженные данные (например, запрашивать выборку разных слоёв).

Можно добавлять новые данные HELML к уже загруженным.

Можно получать значения по указанному пути.

## Примеры:

### Инициализаиця объекта с установкой исходного HELML

```JavaScript

const hObj = new HELMLobject(`
A:  123
B:  345
C: test
`);

let results = hObj.decode();

console.log(results);
```
results: {A: 123, B: 345, C: 'test'}

### Отдельно создание HELML-объекта и добавление исходного HELML при декодировании
```JavaScript

const hObj = new HELMLobject();

let results = hObj.decode(`
A:  123
B:  345
C: test
`);

console.log(results);
```

Результат будет точно такой же, как в предыдущем примере

### Добавление исходных строк отдельно
```JavaScript

const hObj = new HELMLobject();

hObj.addSource(`
A:  123
B:  345
`);

hObj.addSource("C: test");

let results = hObj.decode();

console.log(results);
```
Результат будет такой же, как в предыдущих примерах.