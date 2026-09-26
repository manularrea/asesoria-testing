# language: es
# HU-01 · Consulta asistida por IA con protección de datos sensibles
# Trazabilidad: cada escenario lleva la etiqueta del criterio de aceptación que verifica (@CA-xx).
@HU-01 @asesoria
Característica: Consulta asistida por IA con protección de datos sensibles
  Como asesor de servicio al cliente de la entidad financiera
  quiero consultar a AsesorIA la respuesta oficial de un producto en lenguaje natural
  para responder al cliente con rapidez y sin exponer datos sensibles

  Antecedentes:
    Dado que el asesor "asesor.demo" ha iniciado sesión en AsesorIA
    Y se encuentra en la pantalla de chat

  @CA-01
  Escenario: Una consulta del dominio recibe la respuesta oficial con su intención
    Cuando el asesor consulta "¿Cuál es el horario de atención de las sucursales?"
    Entonces el asistente responde con la intención "horario_sucursales"
    Y la respuesta contiene "8:30"
    Y el estado de la respuesta es "ok"
    Y la confianza mostrada es mayor o igual a 0.40

  @CA-01
  Esquema del escenario: Las intenciones del catálogo de productos se reconocen ante paráfrasis
    Cuando el asesor consulta "<consulta>"
    Entonces el asistente responde con la intención "<intencion>"
    Y el estado de la respuesta es "ok"

    Ejemplos:
      | consulta                                        | intencion         |
      | qué necesito para pedir un préstamo personal    | credito_personal  |
      | perdí mi tarjeta de débito, ¿cómo la bloqueo?   | bloqueo_tarjeta   |
      | cuánto puedo retirar del cajero por día         | limites_cajero    |
      | hay un cargo que no reconozco en mi tarjeta     | reporte_fraude    |

  @CA-02
  Escenario: Una consulta fuera del dominio recibe una respuesta de derivación, no una inventada
    Cuando el asesor consulta "¿Cómo preparo una lasaña?"
    Entonces el asistente indica que no tiene información suficiente
    Y el estado de la respuesta es "fallback"

  @CA-03
  Escenario: Una consulta con número de tarjeta se bloquea y se registra enmascarada
    Cuando el asesor consulta "El cliente indica que su tarjeta 4111 1111 1111 1111 fue clonada"
    Entonces el asistente rechaza la consulta por contener datos sensibles
    Y el estado de la respuesta es "blocked"
    Y el historial muestra la consulta con el número enmascarado como "**** **** **** 1111"

  @CA-03 @guardrail-service
  Esquema del escenario: Cualquier dato sensible soportado se bloquea antes de la inferencia
    Cuando el asesor consulta "<consulta>"
    Entonces el asistente rechaza la consulta por contener datos sensibles
    Y el estado de la respuesta es "blocked"
    Y el historial muestra la consulta con el número enmascarado como "<mascara>"

    Ejemplos:
      | consulta                                             | mascara             |
      | transferir a la cuenta CR05 0152 0200 1026 2840 66   | CR** **** **** 4066 |
      | la tarjeta 5500-0000-0000-0004 fue robada            | **** **** **** 0004 |
